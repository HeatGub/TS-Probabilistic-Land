// START ON LOAD
window.addEventListener('load', function() {
// ____________________________________________________ FUNCTIONS ____________________________________________________
function valById(id: string) {
    return Number( (<HTMLInputElement>document.getElementById(id)).value )
}
function hexColorById(id: string) {
    return  (<HTMLInputElement>document.getElementById(id)).value
}

function recalculateShadowParameters () {
    shadowSpread = (lightSourcePositionY/horizonHeight) * shadowSpreadMultiplier + 0.15 // + for minimal shadow length
    shadowSpreadMountain = (lightSourcePositionY)/horizonHeight * shadowSpreadMultiplier + 0.25
}

function updateLightSource() {
    lightSourceCanvas.style.width = lightSourceSize + 'px'
    lightSourceCanvas.style.height = lightSourceSize + 'px'
    lightSourceCanvas.style.left = (lightSourcePositionX - lightSourceSize/2) + 'px'
    lightSourceCanvas.style.top = (lightSourcePositionY - lightSourceSize/2) + 'px'
    lightSourceGlowCanvas.style.width = lightSourceSize*2 + 'px'
    lightSourceGlowCanvas.style.height = lightSourceSize*2 + 'px'
    lightSourceGlowCanvas.style.left = (lightSourcePositionX - lightSourceSize) + 'px'
    lightSourceGlowCanvas.style.top = (lightSourcePositionY - lightSourceSize) + 'px'
    document.documentElement.style.cssText += "--lightSourceColor:" + lightSourceColor // set css color property
}

function hideShowCategoryElements (event: Event) {
    const clickedElemClass = ((event.target as Element).className)
    if (clickedElemClass.includes('sidebarCategory')){ //to disable hiding more inner elements
        const targetsChildren = (event.target as HTMLBodyElement).children
        for (let i=0; i<(targetsChildren.length); i++){
            const thisTarget = targetsChildren[i] as HTMLBodyElement
            if (thisTarget.style.display != 'none') {
                thisTarget.style.display = 'none'
            }
            else {
                thisTarget.style.display = 'block'
            }
        }
    }
}

function hexToRgba(hex: string, alpha: number) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
        const rgbObj = {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        }
        return 'rgba(' + rgbObj.r + ', ' + rgbObj.g + ', ' + rgbObj.b + ', ' + alpha + ')'
    }
    return 'rgba(0,0,0,1)' // if result invalid paint black
}

function randomRgba() {
    return 'rgba(' + Math.round(Math.random()*255) + ', ' + Math.round(Math.random()*255) + ', ' + Math.round(Math.random()*255) + ', ' + 1 + ')'
}

function randomRgbaBright() {
    return 'rgba(' + (125+ Math.round(Math.random()*125)) + ', ' + (125+ Math.round(Math.random()*125)) + ', ' + (125+ Math.round(Math.random()*125)) + ', ' + 1 + ')'
}
// function randomHexColor() {return '#' + Math.floor(Math.random()*16777215).toString(16)}
function rgbaToHex (rgba: string) {
    const rgbaVals = rgba.substring(4, rgba.length-1).replace(/[[\(\))]/g,'').split(',') // /g is global
    let r = parseInt(rgbaVals[0]).toString(16)
    if (r.length==1) {r = "0" + r} // add zero if just one symbol
    let g = parseInt(rgbaVals[1]).toString(16)
    if (g.length==1) {g = "0" + g}
    let b = parseInt(rgbaVals[2]).toString(16)
    if (b.length==1) {b = "0" + b}
    return '#'+r+g+b
}

function paintTheSky() {
    document.body.style.background = skyColor
    const skyCanvas = document.getElementById('skyCanvas') as HTMLCanvasElement
    const skyCtx = skyCanvas.getContext('2d') as CanvasRenderingContext2D
    const gradient = skyCtx.createLinearGradient(skyCanvas.width/2, 0, skyCanvas.width/2, skyCanvas.height)
    gradient.addColorStop(0, skyColor)
    gradient.addColorStop(1, mistColor)
    skyCtx.fillStyle = gradient
    skyCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height)
}

function paintTheGround() {
    const groundCanvas = document.getElementById('groundCanvas') as HTMLCanvasElement
    const groundCtx = groundCanvas.getContext('2d') as CanvasRenderingContext2D
    const gradient = groundCtx.createLinearGradient(groundCanvas.width/2, 0, groundCanvas.width/2, groundCanvas.height)
    gradient.addColorStop(0, mistColor)
    gradient.addColorStop(1, groundColor)
    groundCtx.fillStyle = gradient
    groundCtx.fillRect(0, 0, groundCanvas.width, groundCanvas.height)
}

const globalCanvasesList = [] as HTMLCanvasElement[]

function rgbaStrToObj (color: string) {
    const colorValsArray = color.substring(4, color.length-1).replace(/[[\(\))]/g,'').split(',') // /g is global - as many finds as necessary
    return {r: Number(colorValsArray[0]), g: Number(colorValsArray[1]), b: Number(colorValsArray[2]), a: Number(colorValsArray[3])}
}

function rgbaSetAlpha1 (color: string) {
    const colorValues = rgbaStrToObj(color)
    return 'rgba(' +colorValues.r + ',' + colorValues.g + ',' + colorValues.b + ',1)'
}

function blendRgbaColorsInProportions (color1: string, color2: string, initColorInfluence: number) {
    const colorInitVals = color1.substring(4, color1.length-1).replace(/[[\(\))]/g,'').split(',') // /g is global - as many finds as necessary
    const colorFinalVals = color2.substring(4, color2.length-1).replace(/[[\(\))]/g,'').split(',')
    // console.log(colorInitVals, colorFinalVals)
    
    // BLEND - WEIGHTED AVERAGE
    const resultingRed = (Number(colorInitVals[0])*initColorInfluence + Number(colorFinalVals[0])*(1-initColorInfluence))
    const resultingGreen = (Number(colorInitVals[1])*initColorInfluence + Number(colorFinalVals[1])*(1-initColorInfluence))
    const resultingBlue = (Number(colorInitVals[2])*initColorInfluence + Number(colorFinalVals[2])*(1-initColorInfluence))
    const resultingAlpha = (Number(colorInitVals[3])*initColorInfluence + Number(colorFinalVals[3])*(1-initColorInfluence))
    
    const resultingColor = 'rgba(' + resultingRed + ',' + resultingGreen + ',' + resultingBlue + ',' + resultingAlpha + ')'
    // console.log(resultingColor)
    return resultingColor
}

function addColorInput (category: HTMLElement, id: string, name: string, title: string, value: string, passedFunction: Function) {
    const sidebarElement = document.createElement("div")
    sidebarElement.classList.add("sidebarElement")
    sidebarElement.title = title
    // console.log(sidebarElement)
    category.appendChild(sidebarElement)
    const namePar = document.createElement("p")
    namePar.innerText = name
    sidebarElement.appendChild(namePar)

    const input = document.createElement("input") // create canvas
    input.type = 'color'
    // input.classList.add("sliderClass")
    // input.setAttribute('data-slider', name)
    input.id = id // Range
    input.value = String(value)
    sidebarElement.appendChild(input)

    input.addEventListener('input', () => {
        passedFunction()
    })
}

function addSlider (category: HTMLElement, id: string, name: string, title: string,  min: number, max: number, step: number, value: number, passedFunction: Function) {
    const sidebarElement = document.createElement("div")
    sidebarElement.classList.add("sidebarElement")
    sidebarElement.title = title
    // console.log(sidebarElement)
    category.appendChild(sidebarElement)
    const namePar = document.createElement("p")
    namePar.innerText = name
    sidebarElement.appendChild(namePar)

    const span = document.createElement("span")
    sidebarElement.appendChild(span)

    const slider = document.createElement("input") // create canvas
    slider.type = 'range'
    // slider.classList.add("sliderClass")
    slider.setAttribute('data', id)
    slider.id = id // Range
    slider.min = String(min)
    slider.max = String(max)
    slider.step = String(step)
    slider.value = String(value)
    span.appendChild(slider)

    const sliderText = document.createElement("input")
    sliderText.setAttribute('data', id)
    sliderText.id = id + '_T' // Text
    sliderText.type = 'text'
    sliderText.value = String(value)
    span.appendChild(sliderText)

    // EVENT LISTENERS - BOTH FIRE func()
    slider.addEventListener('input', () => {
        sliderText.value = slider.value
        passedFunction()
    })

    sliderText.addEventListener('input', () => {
        slider.value = sliderText.value
        passedFunction()
    })
}

//  SET CANVASES SIZES AND CHANGE THEM AT WINDOW RESIZE?
// const memorizedCanvases = []
window.addEventListener('resize', function() {
    redrawMountains()
    globalCanvasesList.forEach( (canvas) => {
        const memorizedCanvas = canvas.getContext('2d')
        console.log(memorizedCanvas)
        // canvas.width = window.innerWidth
        // canvas.height = window.innerHeight
    })
    // window.location.reload() // refresh page
    // tree.drawTheTree() // tree possibly not ready at resize
})

// ____________________________________________________ FUNCTIONS ____________________________________________________

// ____________________________________________________ SIDEBAR ____________________________________________________
// ___________________ CONSTANT PARAMETERS___________________
const SIDEBAR_WIDTH = 250
const branchLenRandomizer = 0.15 // keep it const
const leavesGrowingOrder = 0.25
const growLimitingLeavesAmount = 10 // branches drawing will stop when this amount of growing leaves is reached
const treeShapeShadow = 0.2 // not much, not needed as a parameter
// ___________________ CONSTANT PARAMETERS___________________


let sidebarCategories = document.querySelectorAll(".sidebarCategory")
sidebarCategories.forEach(function(category) {category.addEventListener("click", hideShowCategoryElements)})
// SIDEBAR OPENING AND CLOSING
const closeSidebarButton = document.getElementById('closeSidebarButton') as HTMLBodyElement
const SIDEBAR = document.getElementById('sidebar') as HTMLBodyElement
// sidebar.style.display = 'none'
SIDEBAR.style.width = SIDEBAR_WIDTH + 'px'
closeSidebarButton.style.left = SIDEBAR_WIDTH + 'px'
closeSidebarButton.addEventListener("click", () => {
    if (SIDEBAR.style.display == 'none') {
        closeSidebarButton.style.left = String(SIDEBAR_WIDTH) + 'px'
        SIDEBAR.style.display = 'block'
    }
    else if (SIDEBAR.style.display != 'none') {
        closeSidebarButton.style.left = String(0)
        SIDEBAR.style.display = 'none'
    }
})
const undoButton = this.document.getElementById('undoButton') as HTMLBodyElement
let treesList: Tree [] = []
undoButton.addEventListener('click', removeLastTree )
function removeLastTree () {
    if (treesList.length > 0) {
        treesList[treesList.length-1].removeTreeCanvases()
        treesList.splice(-1)
    }
}

let mountainsDrawn: Mountain[] = []
const CTGR_PERSPECTIVE = document.getElementById('CTGR_PERSPECTIVE') as HTMLElement
const CTGR_LIGHTSOURCE = document.getElementById('CTGR_LIGHTSOURCE') as HTMLElement
const CTGR_SHADOWS = document.getElementById('CTGR_SHADOWS') as HTMLElement
const CTGR_BRANCH = document.getElementById('CTGR_BRANCH') as HTMLElement
const CTGR_LEAF = document.getElementById('CTGR_LEAF') as HTMLElement
const CTGR_MOUNTAINS = document.getElementById('CTGR_MOUNTAINS') as HTMLElement
const CTGR_TREE = document.getElementById('CTGR_TREE') as HTMLElement

CTGR_BRANCH.style.display = 'none'
// CTGR_LEAF.style.display = 'none'
CTGR_MOUNTAINS.style.display = 'none'
CTGR_SHADOWS.style.display = 'none'
CTGR_LIGHTSOURCE.style.display = 'none'

const canvasContainer = document.getElementById('canvasContainer') as HTMLBodyElement
// let horizonHeight = Math.round(canvasContainer.offsetHeight*0.2 + Math.random()*canvasContainer.offsetHeight*0.6)
let horizonHeight = Math.round(window.innerHeight*0.2 + Math.random()*window.innerHeight*0.4)
document.documentElement.style.cssText += "--horizonHeight:" + horizonHeight + "px" // set css property
// LIGHTSOURCE
const lightSourceCanvas = document.getElementById('lightSourceCanvas') as HTMLBodyElement
const lightSourceGlowCanvas = document.getElementById('lightSourceGlowCanvas') as HTMLBodyElement
let lightSourcePositionX = Math.round(Math.random() * this.window.innerWidth)
let lightSourcePositionY = Math.round(Math.random() * horizonHeight*0.8)
let lightSourceSize = Math.round(50 + Math.random()*horizonHeight/2)

let mountainRangeWidthMultiplier = Number((Math.random()*0.5).toFixed(2))
let mountainRangeWidth = (window.innerHeight - horizonHeight)*0.1 + (window.innerHeight - horizonHeight)*mountainRangeWidthMultiplier

let shadowSpreadMultiplier = Number((1 + (Math.random()*5)).toFixed(1)) // change that later?
let shadowHorizontalStretch =  Number((1 + (Math.random()*3)).toFixed(1))
let shadowSpread = (lightSourcePositionY/horizonHeight) *shadowSpreadMultiplier + 0.15 // + for minimal shadow length
let shadowSpreadMountain = (lightSourcePositionY)/horizonHeight * shadowSpreadMultiplier + 0.5
let treeShadowBlur = 0
let shadowColorGlobal = randomRgba()

let distanceScaling = Number((0.1 + Math.random()*0.8).toFixed(2))
let mountainsAmount = Math.round(1 + Math.random()*9)

let mountainTrimCloser = Number((0.1 + Math.random()*0.8).toFixed(2)) // 0-1
let mountainHeightMultiplier = Number((0.25 + Math.random()*0.25).toFixed(2)) // 0.1 - 1?

let maxLevelTree = Math.round(4 + Math.random() * 2)
let trunkLen = Math.round(120 + Math.random() * 80)

// let initialsegmentingLen = Number((0.1 + Math.random()*0.8).toFixed(2))
let initialsegmentingLen = 0.05

let lenMultiplier = Number((0.6 + Math.random()*0.3).toFixed(2))
let trunkWidthAsPartOfLen = Number((0.1 + Math.random()*0.2).toFixed(2))
let widthMultiplier = Number((0.5 + Math.random()*0.2).toFixed(2))
let rebranchingAngle = Number((5 + Math.random() * 15).toFixed(1))
let branchingProbabilityBooster = Number(Math.random().toFixed(2)) // when 0 trees look more like sick
let occasionalBranchesLimit = Math.round(Math.random()*4)
let levelShiftRangeAddition = Math.round(Math.random()*2)

// AXIS 1 WILL BE THE WIDER ONE. BOTH AXES ARE PERPENDICULAR TO THE LEAF'S MAIN NERVE (x0,y0 - xF,yF)
// ratio is relative to Leaf's this.len
let axis1WidthRatio = Number((0.5 + Math.random()*0.5).toFixed(2))
let axis2WidthRatio  = Number((0.5 + Math.random()*0.5).toFixed(2))
let axis1PositionAsLenRatio = Number((-0.2 + Math.random()*0.5).toFixed(2))
let axis2PositionAsLenRatio = Number((0.5 + Math.random()*0.5).toFixed(2))
let petioleLenRatio = Number((0 + Math.random()*0.3).toFixed(2))
let leafLenScaling = Number((0.75 + Math.random()*0.5).toFixed(2))
let leafDistanceMultiplier = Number((0.5 + Math.random()*0.5).toFixed(2))
let leafLineWidth = Number((0.01 + Math.random()*0.05).toFixed(3))
let globalLeafProbability = Number((0.5 + Math.random()*0.15).toFixed(2)) // SAME PROBABILITY FOR EACH SIDE
// let globalLeafProbability = 1 // SAME PROBABILITY FOR EACH SIDE
let leafyLevels = Math.round( 3 + Math.random() * 2)
let leafMaxStageGlobal = Math.round( 2 + Math.random() * 10)
let whileLoopRetriesEachFrameLeaves = 100 // when that = 1 --> ~1 FPS for leafMaxStageGlobal = 60
let colorTreeInitialGlobal = randomRgba()
let colorTreeFinalGlobal = randomRgba()
let colorLeaf = randomRgba()
let leafLineDarkness = Number((-0.5 + Math.random()*0.5).toFixed(2)) // 0-1 range (or even -1 to +1)
let leafBrightnessRandomizer = Math.round(Math.random() * 50) // +- in rgb scale (0-255)
let leafColorRandomizerR = Math.round(Math.random() * 150) // +- in rgb scale (0-255)
let leafColorRandomizerG = Math.round(Math.random() * 150) // +- in rgb scale (0-255)
let leafColorRandomizerB = Math.round(Math.random() * 150) // +- in rgb scale (0-255)

let skyColor = randomRgba()
let mistColor = randomRgba()
let mountainColor = randomRgba()
let groundColor = randomRgba()
let lightSourceColor = randomRgbaBright()
let treeMistBlendingProportion = Number((0.5 + Math.random()*0.5).toFixed(2))
let treeShadowBlendingProportion = Number((0.5 + Math.random()*0.5).toFixed(2)) // blend shadow color with ground color
let leafFolding = Number(( Math.random()*0.25).toFixed(2))
let randomizeLeafSize = Number((0.2 +  Math.random()*0.3).toFixed(2))
// ____________________________________________________________ HERE PASSLINE____________________________________________________________

// TOODOO LIST
// find skrajne puynkty drzewa żeby byl mniejszy canvas i nie trzeba go bylo rozciagac
// albo rozciagnac canvas


updateLightSource()
paintTheSky()
paintTheGround()

// ____________________________________________________ PARAMETERS ____________________________________________________
// CREATE SLIDER AND PASS LISTERENS FUNCTION TO IT. FUNCTION FIRES ON SLIDER'S TEXT INPUT ALSO.
// SOME VARIABLES ARE IN MANY EQUATIONS AFTERWARDS (like shadow length depends on lightsource position and that depends on horizon height)

// CTGR_PERSPECTIVE
addSlider(CTGR_PERSPECTIVE , 'horizonHeight', 'sky (horizon) height' , '', Math.round(window.innerHeight*0.1), Math.round(window.innerHeight*0.9), 1, horizonHeight, () => {
    horizonHeight = valById('horizonHeight')
    document.documentElement.style.cssText += "--horizonHeight: " + horizonHeight + "px;"
    // console.log(document.documentElement.style.cssText)
    mountainRangeWidth = (window.innerHeight - horizonHeight) * mountainRangeWidthMultiplier
    recalculateShadowParameters()
    updateLightSource()
    // paintTheSky() // css handles it
    // paintTheGround() // css handles it
    redrawMountains()
    // change max lightsource position not to stay below horizon
    const lightSourceMaxCoordY = document.getElementById('lightSourcePositionY') as HTMLInputElement
    lightSourceMaxCoordY.max = String(horizonHeight)
    if (lightSourcePositionY >= horizonHeight) {
        lightSourcePositionY = horizonHeight
    }
})
addSlider(CTGR_PERSPECTIVE, 'distanceScaling', 'distance scaling' , '',  0 , 1 ,  0.01, distanceScaling, () => {
    distanceScaling = valById('distanceScaling')
    redrawMountains()
})

// LIGHTSOURCE
addSlider(CTGR_LIGHTSOURCE, 'lightSourcePositionX', 'x coordinate' , '',  0 , window.innerWidth ,  1, lightSourcePositionX, () => {
    lightSourcePositionX = valById('lightSourcePositionX')
    updateLightSource()
    recolorMountains()
})
addSlider(CTGR_LIGHTSOURCE, 'lightSourcePositionY', 'y coordinate' , '',  0 , horizonHeight ,  1, lightSourcePositionY, () => {
    lightSourcePositionY = valById('lightSourcePositionY')
    updateLightSource() 
    recalculateShadowParameters()
    recolorMountains()
})
addSlider(CTGR_LIGHTSOURCE, 'lightSourceSize', 'size' , '',  0 , Math.round(window.innerHeight/2) ,  1, lightSourceSize, () => {
    lightSourceSize = valById('lightSourceSize')
    updateLightSource()
})

//SHADOW
addSlider(CTGR_SHADOWS, 'shadowSpreadMultiplier', 'vertical stretch' , '',  0 , 10 ,  0.1, shadowSpreadMultiplier, () => {
    shadowSpreadMultiplier = valById('shadowSpreadMultiplier')
    recalculateShadowParameters()
    recolorMountains()
})
addSlider(CTGR_SHADOWS, 'shadowHorizontalStretch', 'horizontal stretch' , '',  0.1 , 5 ,  0.1, shadowHorizontalStretch, () => {
    shadowHorizontalStretch = valById('shadowHorizontalStretch')
    recalculateShadowParameters()
    recolorMountains()
})
addSlider(CTGR_SHADOWS, 'treeShadowBlur', 'tree shadow blur' , '',  0 , 100 ,  0.1, treeShadowBlur, () => {
    treeShadowBlur = valById('treeShadowBlur')
})
addColorInput(CTGR_SHADOWS, 'shadowColor', 'shadow color', '', rgbaToHex(shadowColorGlobal), () => {
    shadowColorGlobal = hexToRgba(hexColorById('shadowColor'), 1) // alpha =1
    recolorMountains()
})

// MOUNTAINS
addSlider(CTGR_MOUNTAINS , 'mountainRangeWidthMultiplier', 'width' , 'as a part of ground height',  0.01, 1 , 0.01, mountainRangeWidthMultiplier, () => {
    mountainRangeWidthMultiplier = valById('mountainRangeWidthMultiplier')
    mountainRangeWidth = (window.innerHeight - horizonHeight) * mountainRangeWidthMultiplier
    redrawMountains()
})
addSlider(CTGR_MOUNTAINS , 'mountainsAmount', 'amount' , '',  0, 100 , 1, mountainsAmount, () => {
    mountainsAmount = valById('mountainsAmount')
    redrawMountains()
})
addSlider(CTGR_MOUNTAINS , 'mountainTrimCloser', 'trim closer' , '',  0, 1 , 0.01, mountainTrimCloser, () => {
    mountainTrimCloser = valById('mountainTrimCloser')
    redrawMountains()
})
addSlider(CTGR_MOUNTAINS , 'mountainHeightMultiplier', 'height' , '',  0, 1 , 0.01, mountainHeightMultiplier, () => {
    mountainHeightMultiplier = valById('mountainHeightMultiplier')
    redrawMountains()
})

// BRANCH
addSlider(CTGR_BRANCH , 'trunkLen', 'trunk length' , '',  1, 200 , 1, trunkLen, () => {
    trunkLen = valById('trunkLen')
})
addSlider(CTGR_BRANCH , 'trunkWidthAsPartOfLen', 'trunk width' , 'as part of its length',  0.01, 1 , 0.01, trunkWidthAsPartOfLen, () => {
    trunkWidthAsPartOfLen = valById('trunkWidthAsPartOfLen')
})
addSlider(CTGR_BRANCH , 'initialsegmentingLen', 'segment length' , 'as a part of trunk length',  0.01, 1 , 0.01, initialsegmentingLen, () => {
    initialsegmentingLen = valById('trunkLen')
})
addSlider(CTGR_BRANCH , 'lenMultiplier', 'child length' , 'part of parent branch length',  0.1, 1 , 0.01, lenMultiplier, () => {
    lenMultiplier = valById('lenMultiplier')
})
addSlider(CTGR_BRANCH , 'widthMultiplier', 'child width' , 'part of parent branch width',  0.1, 1 , 0.01, widthMultiplier, () => {
    widthMultiplier = valById('widthMultiplier')
})
addSlider(CTGR_BRANCH , 'rebranchingAngle', 'rebranching angle' , 'angle between parent and child branch (it\'s randomized arterwards) ',  1, 45 , 0.1, rebranchingAngle, () => {
    rebranchingAngle = valById('rebranchingAngle')
})
addSlider(CTGR_BRANCH , 'branchingProbabilityBooster', 'branching booster' , '',  0, 1 , 0.01, branchingProbabilityBooster, () => {
    branchingProbabilityBooster = valById('branchingProbabilityBooster')
})
addSlider(CTGR_BRANCH , 'occasionalBranchesLimit', 'occasional branches limit' , '',  0, 4 , 1, occasionalBranchesLimit, () => {
    occasionalBranchesLimit = valById('occasionalBranchesLimit')
})
addSlider(CTGR_BRANCH , 'levelShiftRangeAddition', 'level shift addition' , 'level shifts happen with occasional branching - when level of branch is not parent level +1',  0, 4 , 1, levelShiftRangeAddition, () => {
    levelShiftRangeAddition = valById('levelShiftRangeAddition')
})

// TREE
addSlider(CTGR_TREE , 'maxLevelTree', 'max level' , 'title', 1, 16, 1, maxLevelTree, () => {
    maxLevelTree = valById('maxLevelTree')
}) // min > 0!
addColorInput(CTGR_TREE, 'colorTreeInitialGlobal', 'trunk color', '', rgbaToHex(colorTreeInitialGlobal), () => {
    colorTreeInitialGlobal = hexToRgba(hexColorById('colorTreeInitialGlobal'), 1)
})
addColorInput(CTGR_TREE, 'colorTreeFinalGlobal', 'top color', '', rgbaToHex(colorTreeFinalGlobal), () => {
    colorTreeFinalGlobal = hexToRgba(hexColorById('colorTreeFinalGlobal'), 1)
})

// LEAF
addSlider(CTGR_LEAF , 'axis1WidthRatio', 'axis 1 width' , 'closer to petiole',  0, 2 , 0.01, axis1WidthRatio, () => {
    axis1WidthRatio = valById('axis1WidthRatio')
})
addSlider(CTGR_LEAF , 'axis2WidthRatio', 'axis 2 width' , 'further to petiole',  0, 2 , 0.01, axis2WidthRatio, () => {
    axis2WidthRatio = valById('axis2WidthRatio')
})
addSlider(CTGR_LEAF , 'axis1PositionAsLenRatio', 'axis 1 position' , 'as a part of leaf length. Negative values to make leaf blade growing back',  -0.5, 1 , 0.01, axis1PositionAsLenRatio, () => {
    axis1PositionAsLenRatio = valById('axis1PositionAsLenRatio')
})
addSlider(CTGR_LEAF , 'axis2PositionAsLenRatio', 'axis 2 position' , 'as a part of leaf length',  0.5, 1.5 , 0.01, axis2PositionAsLenRatio, () => {
    axis2PositionAsLenRatio = valById('axis2PositionAsLenRatio')
})
addSlider(CTGR_LEAF , 'petioleLenRatio', 'petiole lenght' , 'as a part of leaf length',  0, 1 , 0.01, petioleLenRatio, () => {
    petioleLenRatio = valById('petioleLenRatio')
})
addSlider(CTGR_LEAF , 'globalLeafProbability', 'leaf probability' , 'at each leaf node 3 leaves have the same chance to appear. It is this value.',  0, 1 , 0.01, globalLeafProbability, () => {
    globalLeafProbability = valById('globalLeafProbability')
})
addSlider(CTGR_LEAF , 'leafyLevels', 'leafy levels' , '',  0, 10 , 1, leafyLevels, () => {
    leafyLevels = valById('leafyLevels')
})
addSlider(CTGR_LEAF , 'leafLenScaling', 'length scaling' , '',  0.01, 3 , 0.01, leafLenScaling, () => {
    leafLenScaling = valById('leafLenScaling')
})
addSlider(CTGR_LEAF , 'leafDistanceMultiplier', 'distancing' , 'leaves spawn at segments, so this parameter works only if there is a segment to spawn a leaf on',  0.1, 2 , 0.1, leafDistanceMultiplier, () => {
    leafDistanceMultiplier = valById('leafDistanceMultiplier')
})
addSlider(CTGR_LEAF , 'leafLineWidth', 'leaf line width' , 'as a part of leaf length',  0.001, 0.1, 0.001, leafLineWidth, () => { // change to leafLineWidth*len?
    leafLineWidth = valById('leafLineWidth')
})
addSlider(CTGR_LEAF , 'leafMaxStageGlobal', 'amount of growth stages' , '',  2, 200, 1, leafMaxStageGlobal, () => {
    leafMaxStageGlobal = valById('leafMaxStageGlobal')
})
addSlider(CTGR_LEAF , 'whileLoopRetriesEachFrameLeaves', 'drawing pack' , 'drawing attepmts in each frame',  1, 1000, 1, whileLoopRetriesEachFrameLeaves, () => {
    whileLoopRetriesEachFrameLeaves = valById('whileLoopRetriesEachFrameLeaves')
})
addColorInput(CTGR_LEAF, 'colorLeaf', 'leaf color', 'base color', rgbaToHex(colorLeaf), () => {
    colorLeaf = hexToRgba(hexColorById('colorLeaf'), 1)
})
addSlider(CTGR_LEAF , 'leafLineDarkness', 'leaf line darkness' , 'negative values add brightness',  -1, 1, 0.01, leafLineDarkness, () => {
    leafLineDarkness = valById('leafLineDarkness')
})
addSlider(CTGR_LEAF , 'leafBrightnessRandomizer', 'color brightness randomizer' , 'in rgb scale',  0, 255, 1, leafBrightnessRandomizer, () => {
    leafBrightnessRandomizer = valById('leafBrightnessRandomizer')
})
addSlider(CTGR_LEAF , 'leafColorRandomizerR', 'red randomizer' , 'randomizes r component of rgb color (if its value < 255)',  0, 255, 1, leafColorRandomizerR, () => {
    leafColorRandomizerR = valById('leafColorRandomizerR')
})
addSlider(CTGR_LEAF , 'leafColorRandomizerG', 'green randomizer' , 'randomizes g component of rgb color (if its value < 255)',  0, 255, 1, leafColorRandomizerG, () => {
    leafColorRandomizerG = valById('leafColorRandomizerG')
})
addSlider(CTGR_LEAF , 'leafColorRandomizerB', 'blue randomizer' , 'randomizes b component of rgb color (if its value < 255)',  0, 255, 1, leafColorRandomizerB, () => {
    leafColorRandomizerB = valById('leafColorRandomizerB')
})
addSlider(CTGR_LEAF , 'leafFolding', 'leaf folding' , 'folding leaf by its angle and random number',  0, 0.25, 0.01, leafFolding, () => {
    leafFolding = valById('leafFolding')
})
addSlider(CTGR_LEAF , 'randomizeLeafSize', 'size randomization' , 'randomize leaf size',  0, 1, 0.01, randomizeLeafSize, () => {
    randomizeLeafSize = valById('randomizeLeafSize')
})


// COLORS?
addColorInput(CTGR_PERSPECTIVE, 'skyColor', 'sky color', '', rgbaToHex(skyColor), () => {
    skyColor = hexToRgba(hexColorById('skyColor'), 1)
    paintTheSky()
})
addColorInput(CTGR_PERSPECTIVE, 'mistColor', 'mist color', '', rgbaToHex(mistColor), () => {
    mistColor = hexToRgba(hexColorById('mistColor'), 1)
    paintTheSky()
    paintTheGround()
    recolorMountains()
})
addColorInput(CTGR_PERSPECTIVE, 'mountainColor', 'mountain color', '', rgbaToHex(mountainColor), () => {
    mountainColor = hexToRgba(hexColorById('mountainColor'), 1)
    recolorMountains()
})
addColorInput(CTGR_PERSPECTIVE, 'groundColor', 'ground color', '', rgbaToHex(groundColor), () => {
    groundColor = hexToRgba(hexColorById('groundColor'), 1)
    paintTheGround()
})
addColorInput(CTGR_PERSPECTIVE, 'lightSourceColor', 'lightsource color', '', rgbaToHex(lightSourceColor), () => {
    lightSourceColor = hexToRgba(hexColorById('lightSourceColor'), 1)
    updateLightSource()
})
addSlider(CTGR_PERSPECTIVE , 'treeMistBlendingProportion', 'tree mist blending' , 'blend tree color with mist color',  0, 1, 0.01, treeMistBlendingProportion, () => {
    treeMistBlendingProportion = valById('treeMistBlendingProportion')
})
addSlider(CTGR_PERSPECTIVE , 'treeShadowBlendingProportion', 'tree shadow blending' , 'blend tree shadow color with mist color',  0, 1, 0.01, treeShadowBlendingProportion, () => {
    treeShadowBlendingProportion = valById('treeShadowBlendingProportion')
})

// let groundColor = randomRgba()

// ____________________________________________________ PARAMETERS ____________________________________________________
// ____________________________________________________ SIDEBAR ____________________________________________________

// ____________________________________________________ BRANCH ____________________________________________________
class Branch {
    constructor(
        readonly parent: Branch|Root, // parent branch or root
        readonly x0: number,
        readonly y0: number,
        readonly len: number,
        readonly angle: number,
        readonly branchWidth: number,
        readonly levelShift: number = 0,
        readonly xF: number = 0, //could be ? but then lineTo errors with null
        readonly yF: number  = 0,
        readonly level: number = 0,
        readonly children: Branch[] = [], // list of children branches
        readonly segments: { x0: number, y0: number, xF: number, yF: number, width: number, leaves: Leaf[] }[] = [], // segments endpoints to draw lines between
        public drawnSegments: number = 0, //to track branch drawing progress
        public occasionalBranches = 0,
        readonly tree: Tree = parent.tree,
        readonly shadowSegments: { x0: number, y0: number, xF: number, yF: number, width: number, blur: number}[] = [],
        // public color: {r: number, g: number, b: number, a:number} = {r: 0, g: parent.color.g+20, b: 0, a: 1},
        readonly color: {r: number, g: number, b: number, a:number} = {r: 0, g:0, b: 0, a: 1},
    ){

        // RECALCULATE LEN AND WIDTH WITH levelShift
        this.level = this.parent.level + 1 + this.levelShift
        this.color = {
            r: rgbaStrToObj(this.tree.colorTreeInitial).r + tree.redPerLevel*(this.level+1), // level +1 because trunk is level 0
            g: rgbaStrToObj(this.tree.colorTreeInitial).g + tree.greenPerLevel*(this.level+1), 
            b: rgbaStrToObj(this.tree.colorTreeInitial).b + tree.bluePerLevel*(this.level+1), 
            a: 1
        }    

        // Occasional branch length (or width) = orig.len * lenMultipl^levelShift
        this.branchWidth = this.branchWidth * Math.pow(widthMultiplier, this.levelShift)
        this.len = this.len * Math.pow(lenMultiplier, this.levelShift)
        this.len = this.len + (- this.len*branchLenRandomizer/2 + this.len*Math.random()*branchLenRandomizer) //randomize len

        // recalculate the angle according to parent branch first 
        this.angle = this.parent.angle + this.angle
        // THEN CALCULATE BRANCH TIP (FINAL) COORDINATES
        this.xF = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len
        this.yF = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len

        // CHECK TREE EXTREME POINTS
        // y0 extreme is always trunk because branches dont grow below its level
        if (this.xF > this.tree.extremes.xF) {
            this.tree.extremes.xF = this.xF
        }
        if (this.xF < this.tree.extremes.x0) {
            this.tree.extremes.x0 = this.xF
        }
        if (this.yF < this.tree.extremes.yF) {
            this.tree.extremes.yF = this.yF
        }

        // ____________ SEGMENTING A BRANCH ____________
        // let segAmountByLevel = Math.ceil( ((trunkLen*(Math.pow(lenMultiplier, this.level))) / initialsegmentingLen) + (this.level) )
        let segAmountByLevel = Math.ceil( ((this.tree.trunkLen*(Math.pow(lenMultiplier, this.level))) / this.tree.initialsegmentingLen) )

        for (let seg=0; seg < segAmountByLevel; seg++){
            // EXIT LOOP IF SEGMENT IS NEARLY TOUCHING THE GROUND (this.tree.initY-this.tree.trunkLen/15)
            // this.level > 0 not to affect the trunk
            if (this.level > 0 && seg >= 1  &&  this.segments[seg-1].y0 > (this.tree.initY-this.tree.trunkLen/15) || this.level > 0 && seg >= 1  &&  this.segments[seg-1].yF > (this.tree.initY-this.tree.trunkLen/15)) {
                return
            }

            this.segments.push({x0: 0, y0: 0, xF: 0, yF: 0, width: 0, leaves: []})
            // Calculate coordinates analogically to branch xF yF, but for shorter lengths. 
            // segment is in range from (seg/segAmount) to ((seg +1)/segAmount) * len
            this.segments[seg].x0 = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len * (seg/segAmountByLevel)
            this.segments[seg].y0 = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len * (seg/segAmountByLevel)
            this.segments[seg].xF = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len * ((seg +1)/segAmountByLevel)
            this.segments[seg].yF = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len * ((seg +1)/segAmountByLevel)
            // linearly change branchWidth for each segment 
            this.segments[seg].width = this.branchWidth + ((segAmountByLevel - seg + 1) / segAmountByLevel) * (this.branchWidth/widthMultiplier - this.branchWidth) // this.branchWidth/widthMultiplier makes width as +1 lvl

            // // SHADOW SEGMENT
            this.shadowSegments.push({x0: 0, y0: 0, xF: 0, yF: 0, width: 0, blur: 0})
            this.shadowSegments[seg].y0 = this.tree.initY + (this.tree.initY - this.segments[seg].y0) * shadowSpread
            this.shadowSegments[seg].yF = this.tree.initY + (this.tree.initY - this.segments[seg].yF) * shadowSpread
            this.shadowSegments[seg].x0 = this.segments[seg].x0 + (this.tree.initY - this.segments[seg].y0) * shadowSpread * this.tree.shadowAngle
            this.shadowSegments[seg].xF = this.segments[seg].xF + (this.tree.initY - this.segments[seg].yF) * shadowSpread * this.tree.shadowAngle
            // this.shadowSegments[seg].width = this.segments[this.drawnSegments].width + ((this.tree.initY - this.segments[this.drawnSegments].y0)*(shadowSpread/200)) + (Math.abs((this.tree.initX - this.segments[this.drawnSegments].x0)))*(shadowSpread/200)
            this.shadowSegments[seg].width = this.segments[seg].width + ((this.tree.initY - this.segments[seg].y0)*(shadowSpread/200)) + (Math.abs((this.tree.initX - this.segments[seg].x0)))*(shadowSpread/200)
            
            this.shadowSegments[seg].blur = (this.tree.initY - this.segments[seg].y0) / this.tree.canvas.height* treeShadowBlur
            this.segments[seg].leaves.forEach( (leaf) => {  // pass the same blur to children leaves
                leaf.blur = this.shadowSegments[seg].blur
            } )

            // _________________ ADD LEAVES AT SEGMENT _________________
            // if (maxLevelTree - leafyLevels < this.level && seg >= segAmountByLevel/6 && seg % spawnLeafEverySegments === 0) { // seg >= segAmountByLevel/6  to disable appearing leaves at the very beginning (overlapping branches)
            const singleSegmentLength = this.len * (1/segAmountByLevel)
            const spawnLeafEverySegments = Math.ceil(this.tree.minimalDistanceBetweenLeaves / singleSegmentLength)

            if (maxLevelTree-leafyLevels < this.level  &&  seg%spawnLeafEverySegments === 0) { // seg >= segAmountByLevel/6  to disable appearing leaves at the very beginning (overlapping branches)
                const thisLeafSize = (this.tree.averageLeafSize*(1- randomizeLeafSize) + this.tree.averageLeafSize*Math.random()*randomizeLeafSize) * leafLenScaling // randomize leaf size

                const leafProbabilityByLevel = globalLeafProbability - globalLeafProbability*((maxLevelTree-this.level)/leafyLevels/2) // linearly change probability with level from around globalLeafProbability/2 to globalLeafProbability (for leafy levels)
                // console.log(leafProbabilityByLevel)
    
                // LEFT LEAF
                if (Math.random() < leafProbabilityByLevel) {
                    // recalculate leaf starting point to match the segment width
                    const x0Leaf  = this.segments[seg].xF - Math.cos(this.angle/180* Math.PI) * this.segments[seg].width/2
                    const y0Leaf  = this.segments[seg].yF - Math.sin(this.angle/180* Math.PI) * this.segments[seg].width/2
                    const x0LeafShadow  = this.shadowSegments[seg].xF - Math.cos(this.angle/180* Math.PI) * this.shadowSegments[seg].width/2
                    const y0LeafShadow  = this.shadowSegments[seg].yF + Math.sin(this.angle/180* Math.PI) * this.shadowSegments[seg].width/2 // opposite sign to (y0Leaf) because shadow leaves are rotated
                    const leafL = new Leaf (this, x0Leaf , y0Leaf , thisLeafSize*0.9, this.angle -40 - Math.random()*10, x0LeafShadow, y0LeafShadow)
                    this.segments[seg].leaves.push(leafL)
                    // console.log('L ')
                }
                // MIDDLE LEAF
                if (Math.random() < leafProbabilityByLevel) {
                    //recalculate leaf starting point to match the segment width
                    // const x0Leaf  = this.segments[seg].x0
                    const x0Leaf  = this.segments[seg].xF - (Math.cos(this.angle/180* Math.PI) * this.segments[seg].width/4) + Math.random()*(Math.cos(this.angle/180* Math.PI) * this.segments[seg].width/2) // randomize to range 1/4 - 3/4 of segWidth
                    // const y0Leaf  = this.segments[seg].y0 + Math.random()*(Math.sin(this.angle/180* Math.PI) * minimalDistanceBetweenLeaves/2) // randomized
                    const y0Leaf  = this.segments[seg].yF
                    const x0LeafShadow  = this.shadowSegments[seg].xF - (Math.cos(this.angle/180* Math.PI) * this.shadowSegments[seg].width/4) + Math.random()*(Math.cos(this.angle/180* Math.PI) * this.shadowSegments[seg].width/2)
                    const y0LeafShadow  = this.shadowSegments[seg].yF
                    const leafM = new Leaf (this, x0Leaf , y0Leaf , thisLeafSize, this.angle -10 + Math.random()*20, x0LeafShadow, y0LeafShadow) // slightly bigger than side leaves
                    this.segments[seg].leaves.push(leafM) 
                    // console.log(' M ')
                }
                // RIGHT LEAF
                if (Math.random() < leafProbabilityByLevel) {
                    //recalculate leaf starting point to match the segment width
                    const x0Leaf  = this.segments[seg].xF + Math.cos(this.angle/180* Math.PI) * this.segments[seg].width/2
                    const y0Leaf  = this.segments[seg].yF + Math.sin(this.angle/180* Math.PI) * this.segments[seg].width/2
                    const x0LeafShadow  = this.shadowSegments[seg].xF + Math.cos(this.angle/180* Math.PI) * this.shadowSegments[seg].width/2
                    const y0LeafShadow  = this.shadowSegments[seg].yF - Math.sin(this.angle/180* Math.PI) * this.shadowSegments[seg].width/2 // opposite sign
                    const leafR = new Leaf (this, x0Leaf , y0Leaf , thisLeafSize*0.9, this.angle + 40 + Math.random()*10, x0LeafShadow, y0LeafShadow)
                    this.segments[seg].leaves.push(leafR)
                    // console.log('   R ')
                }
            }
        }
    } // Branch constructor

    makeChildBranch(angleDiff: number, levelShift: number) {
        let childBranch: Branch = new Branch (this, this.xF, this.yF, this.len*lenMultiplier, angleDiff, this.branchWidth*widthMultiplier, levelShift)
        this.children.push(childBranch)
        return childBranch
    }

    // make levelshifted Branch at random segment
    makeGrandChildBranch(angleDiff: number, levelShift: number) {
        let randomSegmentIndex = Math.floor(Math.random()*this.segments.length)
        let grandChildBranch: Branch = new Branch (this, this.segments[randomSegmentIndex].xF, this.segments[randomSegmentIndex].yF, this.len*lenMultiplier, angleDiff, this.branchWidth*widthMultiplier, levelShift)
        this.occasionalBranches ++
        this.children.push(grandChildBranch)
        return grandChildBranch
    }
 
    drawBranch() {
        // Add the gradient 
        const gradient = this.tree.ctx.createLinearGradient(this.x0, this.y0, this.xF, this.yF)
        // gradient.addColorStop(0, 'rgb(10,' + (0 + 5*this.level) + ', 0)')
        // gradient.addColorStop(1, 'rgb(10,' + (10 + 5*this.level) + ', 0)')
        this.tree.ctx.strokeStyle = gradient
        this.tree.ctx.lineCap = "round"
        this.tree.ctx.lineWidth = this.branchWidth
        this.tree.ctx.beginPath();
        this.tree.ctx.moveTo(this.x0, this.y0)
        this.tree.ctx.lineTo(this.xF, this.yF)
        // ctx.fillStyle = 'white'
        // ctx.fillText(String(this.angle) + '  ' + String(this.level), (this.xF+this.x0)/2 + 10, (this.y0+this.yF)/2)
        this.tree.ctx.stroke()
        // console.log('drawBranch')
        this.tree.ctx.closePath()
    }

    setLinearGradientStrokeStyle () {
        // gradient color calculated for the whole branch
        const gradient = this.tree.ctx.createLinearGradient(this.x0, this.y0, this.xF, this.yF)
        gradient.addColorStop(0, 'rgba(' + this.parent.color.r + ',' + this.parent.color.g + ',' + this.parent.color.b +', 1)')
        gradient.addColorStop(1, 'rgba(' + this.color.r + ',' + this.color.g + ',' + this.color.b +', 1)')
        this.tree.ctx.strokeStyle = gradient
    }

    drawBranchBySegments() {
        this.setLinearGradientStrokeStyle()

        this.tree.ctx.lineCap = "round"
               
        this.tree.ctx.lineWidth = this.segments[this.drawnSegments].width
        this.tree.ctx.beginPath();
        this.tree.ctx.moveTo(this.segments[this.drawnSegments].x0, this.segments[this.drawnSegments].y0)
        this.tree.ctx.lineTo(this.segments[this.drawnSegments].xF, this.segments[this.drawnSegments].yF)
        this.tree.ctx.stroke()
        this.tree.ctx.closePath()

        //  CHANGE LEAF STATE TO GROWING
        if (this.segments[this.drawnSegments].leaves.length > 0) { // if there are any leaves on this segment, let them grow from now on
            this.segments[this.drawnSegments].leaves.forEach( (leaf) => {
                leaf.state = "growing"
                this.tree.growingLeavesList.push(leaf) // APPEND TO THE GROWING LEAVES LIST
            } )
        }
        this.drawSegmentShadow()
        this.drawnSegments ++
    }

    drawSegmentShadow() {
        if (this.checkIfOutsideDrawingWindow() === false) {
            // const shadowColorValues = rgbaStrToObj(shadowColor)
            // const shadowColorAlpha1= 'rgba(' + shadowColorValues.r + ',' + shadowColorValues.g +  ',' + shadowColorValues.b +  ',1)'
            // this.shadowSegments[this.drawnSegments].y0
            // this.tree.ctxShadows.strokeStyle = shadowColorAlpha1
            this.tree.ctxShadows.strokeStyle = this.tree.shadowColorTree

            this.tree.ctxShadows.lineCap = "round"
            this.tree.ctxShadows.lineWidth = this.shadowSegments[this.drawnSegments].width
            this.tree.ctxShadows.filter = 'blur(' + this.shadowSegments[this.drawnSegments].blur + 'px)'
            this.tree.ctxShadows.beginPath();
            this.tree.ctxShadows.moveTo(this.shadowSegments[this.drawnSegments].x0, this.shadowSegments[this.drawnSegments].y0)
            this.tree.ctxShadows.lineTo(this.shadowSegments[this.drawnSegments].xF, this.shadowSegments[this.drawnSegments].yF)
            this.tree.ctxShadows.stroke()
            this.tree.ctxShadows.closePath()
        }
    }

    checkIfOutsideDrawingWindow () {
        if (
            (this.shadowSegments[this.drawnSegments].x0 <= 0 || 
            this.shadowSegments[this.drawnSegments].x0 >= this.tree.canvas.width)
            && 
            (this.shadowSegments[this.drawnSegments].xF <= 0 || 
            this.shadowSegments[this.drawnSegments].xF >= this.tree.canvas.width)
            ) {
            return true
        }
        if (
            (this.shadowSegments[this.drawnSegments].y0 <= 0 || 
            this.shadowSegments[this.drawnSegments].y0 >= this.tree.canvas.height)
            && 
            (this.shadowSegments[this.drawnSegments].yF <= 0 || 
            this.shadowSegments[this.drawnSegments].yF >= this.tree.canvas.height)
            ) {
            return true
        }  
        // console.log('not outside')
        return false
    }
}
// ____________________________________________________ BRANCH ____________________________________________________

// ____________________________________________________ TREE ____________________________________________________
class Tree {
    constructor(
        readonly initX: number,
        readonly initY: number,
        readonly trunkLen: number,
        readonly shadowAngle: number,
        public colorTreeInitial = colorTreeInitialGlobal,
        public colorTreeFinal = colorTreeFinalGlobal,
        public shadowColorTree = shadowColorGlobal,
        public colorDistortionProportion = 0,
        readonly trunkWidth = trunkLen * trunkWidthAsPartOfLen,
        readonly initAngle: number = 0,
        readonly branchingProbability: number = branchingProbabilityBooster,
        public allBranches: [Branch[]] = [[]],
        public growingLeavesList: Leaf[] = [],
        public leavesList: Leaf[] = [],
        // public canvas = document.getElementById('canvasBranches') as HTMLCanvasElement,
        public canvas = canvasContainer.appendChild(document.createElement("canvas")), // create canvas
        public ctx = canvas.getContext('2d') as CanvasRenderingContext2D,
        public canvasShadows = canvasContainer.appendChild(document.createElement("canvas")), // create canvas for tree shadow
        public ctxShadows = canvasShadows.getContext('2d') as CanvasRenderingContext2D,
        public averageLeafSize = trunkLen/12,
        readonly minimalDistanceBetweenLeaves = averageLeafSize * leafLenScaling * leafDistanceMultiplier, // doesnt count the distance between leaves of different branches
        readonly maxLevel: number = maxLevelTree,
        readonly initialsegmentingLen = trunkLen * valById('initialsegmentingLen'),
        public extremes = {x0: 0, y0: 0, xF: 0, yF: 0},
        public redPerLevel = 0,
        public greenPerLevel = 0,
        public bluePerLevel = 0,
    ){
        this.redPerLevel = (rgbaStrToObj(this.colorTreeFinal).r - rgbaStrToObj(this.colorTreeInitial).r) / maxLevel,
        this.greenPerLevel = (rgbaStrToObj(this.colorTreeFinal).g - rgbaStrToObj(this.colorTreeInitial).g) / maxLevel,
        this.bluePerLevel = (rgbaStrToObj(this.colorTreeFinal).b - rgbaStrToObj(this.colorTreeInitial).b) / maxLevel,

        this.canvas.style.zIndex = String(initY) // higher z-index makes element appear on top
        // SET INITIAL CANVASES SIZE
        this.canvas.classList.add('canvas')
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        globalCanvasesList.push(this.canvas)
        //  SHADOWS CANVAS
        this.canvasShadows.classList.add('canvasShadows')
        this.canvasShadows.width = window.innerWidth
        this.canvasShadows.height = window.innerHeight
        globalCanvasesList.push(this.canvasShadows)
        // this.canvasShadows.style.zIndex = String(initY-1)

        const root = new Root (this)
        const startTime = Date.now()
        this.allBranches[0] = [new Branch (root, this.initX, this.initY, this.trunkLen, this.initAngle, this.trunkWidth)]   //save trunk as 0lvl branch
        // append array for every level ahead. Needed for levelShifted branches
        for (let i = 0; i < this.maxLevel; i++) {
            this.allBranches.push([]) //
        }
        for (let currLvl = 0; currLvl < this.maxLevel; currLvl++) {
            // prob should = 1 for level 0 (trunk) 
            // this variable lowers branching probability with level. In range from 1 to branchingProbability linearly
            let branchingProbabilityByLevel = this.branchingProbability + ( (1-branchingProbability) * ((this.maxLevel-currLvl)/this.maxLevel) )
            // console.log(branchingProbabilityByLevel)
            // let occasionalBranchingProbability = ((this.maxLevel-currLvl+1)/this.maxLevel) // always spawn at lvl 0
            let occasionalBranchingProbability = 10 // always spawn at lvl 0

            // console.log(branchingProbabilityByLevel, currLvl)
            // this.allBranches.push([]) // push empty array to fill it by the forEach loop
            this.allBranches[currLvl].forEach( element => {
                // MAKE BRANCHES IF
                if (element.yF < (this.initY - this.trunkLen/10)) { // IF PARENT'S END IS NOT ON THE GROUND LEVEL
                    // branchingProbabilityByLevel check
                    if (Math.random() < branchingProbabilityByLevel){
                        this.allBranches[currLvl+1].push(element.makeChildBranch(rebranchingAngle + Math.random()*rebranchingAngle, 0))
                    }
                    if (Math.random() < branchingProbabilityByLevel){
                        this.allBranches[currLvl+1].push(element.makeChildBranch(-rebranchingAngle - Math.random()*rebranchingAngle, 0))
                    }
                    // OCCASIONAL BRANCHING WITH LEVEL SHIFT (children level is not parent level + 1)
                    // compare occasionalBranches to occasionalBranchesLimit  
                    if ((Math.random() < occasionalBranchingProbability) && (element.occasionalBranches < occasionalBranchesLimit)) {
                        // random level shift
                        let levelShift = 1 + Math.round(Math.random()*levelShiftRangeAddition)
                        // console.log('occasional branching')
                        if (element.level + 1 + levelShift < this.maxLevel) {
                            const occasionalBranch = element.makeGrandChildBranch(-rebranchingAngle + Math.random()*2*rebranchingAngle, levelShift)                       
                            this.allBranches[currLvl+1+levelShift].push(occasionalBranch)
                            // console.log('occasional, lvl =' + (currLvl+levelShift))
                        }
                    }
                }
            })
        }
        console.log('Tree constructed in ' + (Date.now()- startTime) +  ' ms')
    }// constructor end

    removeTreeCanvases() {
        this.canvas.remove()
        this.canvasShadows.remove()

        this.leavesList.forEach ( (leaf) => {
            leaf.canvas.remove()
            leaf.canvasShadow.remove()
        })
    }
}
// ____________________________________________________ TREE ____________________________________________________

// ____________________________________________________ ROOT ____________________________________________________
// Root just acts as a parent element for the trunk. 
// With the root there is no need to check for parent element in Branch constructor
class Root {
    constructor(
        readonly tree: Tree,
        readonly angle: number = 0, // Rotates the tree
        readonly level: number = -1,
        readonly color = rgbaStrToObj(tree.colorTreeInitial)
    ){
}}
// ____________________________________________________ ROOT ____________________________________________________

// ____________________________________________________ LEAF ____________________________________________________
class Leaf {
    constructor (
        // public parentSeg: {x0: number, y0: number, xF: number, yF: number, width: number}, // parent segment
        readonly parentBranch: Branch,
        private x0: number,
        private y0: number,
        private len: number,
        private angle: number,
        private x0LeafShadow: number,
        private y0LeafShadow: number,
        private lineWidth: number = leafLineWidth * len,
        private xF: number = 0,
        private yF: number  = 0,
        readonly maxStages = leafMaxStageGlobal - 1,
        public currentStage = 0,
        private growthStages: {stageLen:number, xF: number, yF: number, xFPetiole: number, yFPetiole: number, xR1: number, yR1: number, xL1: number, yL1: number, xR2: number, yR2: number, xL2: number, yL2: number}[] = [],
        readonly canvas = canvasContainer.appendChild(document.createElement("canvas")), // create canvas
        readonly ctx = canvas.getContext('2d') as CanvasRenderingContext2D,
        readonly canvasCoords = {x: 0, y: 0}, // canvasTopLeftCorner
        readonly x0rel = 0, // relative coordinates (for the leaf canvas positioning)
        readonly y0rel = 0,
        public state : "hidden" | "growing" | "grown" = "hidden",
        readonly tree: Tree = parentBranch.tree,
        readonly canvasShadow = canvasContainer.appendChild(document.createElement("canvas")),
        readonly ctxShadow = canvasShadow.getContext('2d') as CanvasRenderingContext2D,
        readonly shadowStages: {stageLen:number, xF: number, yF: number, xFPetiole: number, yFPetiole: number, xR1: number, yR1: number, xL1: number, yL1: number, xR2: number, yR2: number, xL2: number, yL2: number}[] = [],
        readonly xFLeafShadow: number = 0,
        readonly yFLeafShadow: number = 0,
        readonly shadowCanvasCoords = {x: 0, y: 0}, // canvasTopLeftCorner
        readonly x0relShadow = 0, // relative coordinates (for the leaf canvas positioning)
        readonly y0relShadow = 0,
        readonly shadowLen = 0,
        public blur = 0,
        private color: {r:number, g: number, b: number} = {r:0, g:0, b:0},
    ) {
        this.tree.leavesList.push(this)
        
        let base = rgbaStrToObj(colorLeaf)
        let brghtnAddtn = -leafBrightnessRandomizer/2 + Math.random()*leafBrightnessRandomizer
        // let rAddtn = - leafColorRandomizerR/2 + Math.random() * leafColorRandomizerR // could result in negatives. Not a big deal since it still works, but changed it.
        // let gAddtn = - leafColorRandomizerG/2 + Math.random() * leafColorRandomizerG
        // let bAddtn = - leafColorRandomizerB/2 + Math.random() * leafColorRandomizerB
        this.color = {r: base.r + brghtnAddtn + Math.random()*leafColorRandomizerR, g: base.g + brghtnAddtn + Math.random()*leafColorRandomizerG, b: base.b + brghtnAddtn + Math.random()*leafColorRandomizerB}

        // console.log(leafColorRandomizerR, leafColorRandomizerG, leafColorRandomizerB)
        // console.log(this.color)

        let leafColor = 'rgba(' + this.color.r + ',' + this.color.g +  ',' + this.color.b + ')'
        let colorResulting = blendRgbaColorsInProportions(mistColor, leafColor, this.tree.colorDistortionProportion * treeMistBlendingProportion)
        // NOW BLEND AGAIN WITH SHADOW
        colorResulting = blendRgbaColorsInProportions(shadowColorGlobal, colorResulting, this.tree.colorDistortionProportion * treeShapeShadow)
        const colorFinalValues = rgbaStrToObj(colorResulting)

        this.color = {r: colorFinalValues.r, g: colorFinalValues.g, b: colorFinalValues.b}

        // RESIZE CANVAS (canvasCoords and 0rels depend on it)
        this.canvas.width = this.len*4 // its just *4 but it's not a minimal value which depends on bezier curve shape
        this.canvas.height = this.len*4
        // final len in final stage
        this.xF = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len
        this.yF = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len
        // top left corner of the canvas
        this.canvasCoords.x = (this.x0 + this.xF)/2 - this.canvas.width/2
        this.canvasCoords.y = (this.y0 + this.yF)/2 - this.canvas.height/2
        
        // relative leaf starting coords (for a smaller canvas)
        this.x0rel = this.x0 - this.canvasCoords.x
        this.y0rel = this.y0 - this.canvasCoords.y
        // MOVE CANVAS
        this.canvas.style.left = this.canvasCoords.x + 'px'
        this.canvas.style.top = this.canvasCoords.y + 'px'
        this.canvas.style.zIndex = this.tree.canvas.style.zIndex

        this.canvas.classList.add('leafCanvas')
        this.ctx.lineWidth = this.lineWidth // petiole width

        // _____________________________ LEAF SHADOW _____________________________
        // this.shadowLen = this.len + (this.tree.initY+this.y0LeafShadow)*shadowSpread/100 + Math.abs((this.tree.initX-this.x0LeafShadow)*shadowSpread/100) // shadow len depends on x and y distance from the tree init coords
        this.shadowLen = this.len + (this.tree.initY-this.y0LeafShadow)*-shadowSpread/80 + Math.abs((this.tree.initX-this.x0LeafShadow)*shadowSpread/80)
        // console.log(-(this.tree.initY - this.y0LeafShadow ))

        this.canvasShadow.width = this.shadowLen * 2 // little bit bigger area for blurring
        this.canvasShadow.height = this.shadowLen * 2
        // final len in final stage
        this.xFLeafShadow = this.x0LeafShadow + Math.sin(this.angle/180* Math.PI) * this.shadowLen
        this.yFLeafShadow = this.y0LeafShadow + Math.cos(this.angle/180* Math.PI) * this.shadowLen
        // top left corner of the canvas
        this.shadowCanvasCoords.x = (this.x0LeafShadow + this.xFLeafShadow)/2 - this.canvasShadow.width/2
        this.shadowCanvasCoords.y = (this.y0LeafShadow + this.yFLeafShadow)/2 - this.canvasShadow.height/2
        // coords relative to shadow canvas
        this.x0relShadow = this.x0LeafShadow - this.shadowCanvasCoords.x
        this.y0relShadow = this.y0LeafShadow - this.shadowCanvasCoords.y
        this.canvasShadow.style.left = this.shadowCanvasCoords.x + 'px'
        this.canvasShadow.style.top = this.shadowCanvasCoords.y + 'px'
        this.canvasShadow.classList.add('leafShadowCanvas')
        this.ctxShadow.lineCap = "round"

        // CHECK LENGTH
        // console.log(this.len, Math.sqrt((this.xFLeafShadow-this.x0LeafShadow)**2 + (this.yFLeafShadow-this.y0LeafShadow)**2))
        // _____________________________ LEAF SHADOW _____________________________

        // _____________________________ LEAF STAGES _____________________________
        for (let stg=0; stg <= this.maxStages; stg++) {
            // push zeros to fill the object
            this.growthStages.push({stageLen:0, xF: 0, yF: 0, xFPetiole: 0, yFPetiole: 0, xR1: 0, yR1: 0, xL1: 0, yL1: 0, xR2: 0, yR2: 0, xL2: 0, yL2: 0})
            this.growthStages[stg].stageLen = this.len * ((stg+1)/(this.maxStages+1))  // +1 to make stage 0 leaf longer than 0 
            // CALCULATE TIP (FINAL) COORDINATES. LEAF'S MAIN NERVE ENDS HERE
            this.growthStages[stg].xF = this.x0rel + Math.sin(this.angle/180* Math.PI) * this.growthStages[stg].stageLen
            this.growthStages[stg].yF = this.y0rel - Math.cos(this.angle/180* Math.PI) * this.growthStages[stg].stageLen
            // PETIOLE'S END COORDS
            this.growthStages[stg].xFPetiole = this.x0rel + Math.sin(this.angle/180* Math.PI) * this.growthStages[stg].stageLen * petioleLenRatio
            this.growthStages[stg].yFPetiole = this.y0rel - Math.cos(this.angle/180* Math.PI) * this.growthStages[stg].stageLen * petioleLenRatio
            // 0.5 is no rotation. 0-1 range
            let rotateLeafRightFrom0To1 = 0.5 + Math.sin(this.angle/180* Math.PI)* leafFolding + Math.random()* leafFolding
            // let rotateLeafRightFrom0To1 = 0.5 + Math.random()*leafFolding + Math.sin(this.angle/180*Math.PI) * leafFolding //* Math.random()
            // let rotateLeafRightFrom0To1 = 1

            // BEZIER CURVES - AXIS 1
            const axis1 = this.calcBezierPointsForPerpendicularAxis(axis1PositionAsLenRatio, axis1WidthRatio, rotateLeafRightFrom0To1, stg)
            // BEZIER CURVES - AXIS 2
            const axis2 = this.calcBezierPointsForPerpendicularAxis(axis2PositionAsLenRatio, axis2WidthRatio, rotateLeafRightFrom0To1, stg)
            // FILL UP THIS STAGE
            this.growthStages[stg].xR1 = axis1.xR
            this.growthStages[stg].yR1 = axis1.yR
            this.growthStages[stg].xL1 = axis1.xL
            this.growthStages[stg].yL1 = axis1.yL
            this.growthStages[stg].xR2 = axis2.xR
            this.growthStages[stg].yR2 = axis2.yR
            this.growthStages[stg].xL2 = axis2.xL
            this.growthStages[stg].yL2 = axis2.yL

            // ________________ LEAF SHADOW FOR THIS STAGE ________________
            this.shadowStages.push({stageLen:0, xF: 0, yF: 0, xFPetiole: 0, yFPetiole: 0, xR1: 0, yR1: 0, xL1: 0, yL1: 0, xR2: 0, yR2: 0, xL2: 0, yL2: 0})
            this.shadowStages[stg].stageLen = this.shadowLen * ((stg+1)/(this.maxStages+1))
            this.shadowStages[stg].xF = this.x0relShadow + Math.sin(this.angle/180* Math.PI) * this.shadowStages[stg].stageLen
            this.shadowStages[stg].yF = this.y0relShadow + Math.cos(this.angle/180* Math.PI) * this.shadowStages[stg].stageLen
            // PETIOLE'S END COORDS
            this.shadowStages[stg].xFPetiole = this.x0relShadow + Math.sin(this.angle/180* Math.PI) * this.shadowStages[stg].stageLen * petioleLenRatio
            this.shadowStages[stg].yFPetiole = this.y0relShadow + Math.cos(this.angle/180* Math.PI) * this.shadowStages[stg].stageLen * petioleLenRatio

            // let shadowRotateLeafRightFrom0To1 = 0.35 + Math.sin(this.angle/180* Math.PI)*0.3 // move up this line or add randomization

            // BEZIER CURVES - AXIS 1
            const axis1Shadow = this.calcBezierPointsForPerpendicularAxisShadow(axis1PositionAsLenRatio, axis1WidthRatio, rotateLeafRightFrom0To1, stg)
            // BEZIER CURVES - AXIS 2
            const axis2Shadow = this.calcBezierPointsForPerpendicularAxisShadow(axis2PositionAsLenRatio, axis2WidthRatio, rotateLeafRightFrom0To1, stg)
            // FILL UP THIS STAGE
            this.shadowStages[stg].xR1 = axis1Shadow.xR
            this.shadowStages[stg].yR1 = axis1Shadow.yR
            this.shadowStages[stg].xL1 = axis1Shadow.xL
            this.shadowStages[stg].yL1 = axis1Shadow.yL
            this.shadowStages[stg].xR2 = axis2Shadow.xR
            this.shadowStages[stg].yR2 = axis2Shadow.yR
            this.shadowStages[stg].xL2 = axis2Shadow.xL
            this.shadowStages[stg].yL2 = axis2Shadow.yL
        }
        // _____________________________ LEAF STAGES _____________________________
    } //Leaf constructor

    calcBezierPointsForPerpendicularAxis (axisLenRatio: number, axisWidthRatio: number, moveAxis:number, index: number) {
        let x0Axis = this.x0rel + Math.sin(this.angle/180* Math.PI) * this.growthStages[index].stageLen * axisLenRatio
        let y0Axis = this.y0rel - Math.cos(this.angle/180* Math.PI) * this.growthStages[index].stageLen * axisLenRatio
        // calculate points on line perpendiuclar to the main nerve
        let xR =  x0Axis + Math.sin((90 + this.angle)/180* Math.PI) * this.growthStages[index].stageLen * axisWidthRatio * (moveAxis) // /2 because its only one half
        let yR =  y0Axis - Math.cos((90 + this.angle)/180* Math.PI) * this.growthStages[index].stageLen * axisWidthRatio * (moveAxis)
        let xL =  x0Axis + Math.sin((-90 + this.angle)/180* Math.PI) * this.growthStages[index].stageLen * axisWidthRatio * (1-moveAxis)
        let yL =  y0Axis - Math.cos((-90 + this.angle)/180* Math.PI) * this.growthStages[index].stageLen * axisWidthRatio * (1-moveAxis)
        return {xR: xR, yR: yR, xL: xL, yL: yL}
    }

    calcBezierPointsForPerpendicularAxisShadow (axisLenRatio: number, axisWidthRatio: number, moveAxis:number, index: number) {
        let x0Axis = this.x0relShadow + Math.sin(this.angle/180* Math.PI) * this.shadowStages[index].stageLen * axisLenRatio
        let y0Axis = this.y0relShadow + Math.cos(this.angle/180* Math.PI) * this.shadowStages[index].stageLen * axisLenRatio
        // calculate points on line perpendiuclar to the main nerve
        let xR =  x0Axis + Math.sin((90 + this.angle)/180* Math.PI) * this.shadowStages[index].stageLen * axisWidthRatio * (moveAxis) // /2 because its only one half
        let yR =  y0Axis + Math.cos((90 + this.angle)/180* Math.PI) * this.shadowStages[index].stageLen * axisWidthRatio * (moveAxis)
        let xL =  x0Axis + Math.sin((-90 + this.angle)/180* Math.PI) * this.shadowStages[index].stageLen * axisWidthRatio * (1-moveAxis)
        let yL =  y0Axis + Math.cos((-90 + this.angle)/180* Math.PI) * this.shadowStages[index].stageLen * axisWidthRatio * (1-moveAxis)
        return {xR: xR, yR: yR, xL: xL, yL: yL}
    }

    drawLeafStage () {
        // clear whole previous frame
        // console.log(colorProportion) // 1 - 0
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
        // this.ctx.strokeStyle = colorLeafLine
        // console.log(leafLineDarkness)
        // console.log(this.tree.colorDistortionProportion)
        const strokeStyleBlend = leafLineDarkness* (1-this.tree.colorDistortionProportion)

        // this.ctx.strokeStyle = this.color.r 
        this.ctx.strokeStyle = 'rgba(' + (this.color.r - this.color.r*strokeStyleBlend) + ',' + (this.color.g - this.color.g*strokeStyleBlend) +  ',' + (this.color.b - this.color.b*strokeStyleBlend) + ')'

        this.ctx.beginPath()

        //MAIN NERVE
        this.ctx.moveTo(this.x0rel, this.y0rel)
        this.ctx.lineTo(this.growthStages[this.currentStage].xF, this.growthStages[this.currentStage].yF)
        this.ctx.stroke()
        this.ctx.closePath()

        // BEZIER CURVES FOR BOTH SIDES OF A LEAF
        this.ctx.beginPath();
        this.ctx.moveTo(this.growthStages[this.currentStage].xFPetiole, this.growthStages[this.currentStage].yFPetiole)
        // right side of a leaf
        this.ctx.bezierCurveTo(this.growthStages[this.currentStage].xR1, this.growthStages[this.currentStage].yR1, this.growthStages[this.currentStage].xR2, this.growthStages[this.currentStage].yR2, this.growthStages[this.currentStage].xF, this.growthStages[this.currentStage].yF)
        this.ctx.moveTo(this.growthStages[this.currentStage].xFPetiole, this.growthStages[this.currentStage].yFPetiole)
        // left side of a leaf
        this.ctx.bezierCurveTo(this.growthStages[this.currentStage].xL1, this.growthStages[this.currentStage].yL1, this.growthStages[this.currentStage].xL2, this.growthStages[this.currentStage].yL2, this.growthStages[this.currentStage].xF, this.growthStages[this.currentStage].yF)
        this.ctx.closePath()
        // this.ctx.fillStyle = colorLeaf
        this.ctx.fillStyle = 'rgba(' + this.color.r + ',' + this.color.g +  ',' + this.color.b + ')'
        
        // this.ctx.fillStyle = gradient
        this.ctx.fill()
        this.ctx.stroke()
        this.drawLeafShadow()
    }

    drawLeafShadow () {
        // clear whole previous frame
        this.ctxShadow.clearRect(0, 0, this.canvasShadow.width, this.canvasShadow.height)
        let blur = (this.tree.initY - this.y0) / this.tree.canvas.height* treeShadowBlur
        this.ctxShadow.filter = 'blur(' + blur + 'px)'
        
        // petiole's shadow width
        this.ctxShadow.lineWidth = this.lineWidth + (this.tree.initY-this.y0LeafShadow)*-shadowSpread/1000 + Math.abs((this.tree.initX-this.x0LeafShadow)*shadowSpread/1000)
        this.ctxShadow.beginPath()

        this.ctxShadow.strokeStyle = this.tree.shadowColorTree
        //MAIN NERVE
        this.ctxShadow.moveTo(this.x0relShadow, this.y0relShadow)
        this.ctxShadow.lineTo(this.shadowStages[this.currentStage].xF, this.shadowStages[this.currentStage].yF)
        this.ctxShadow.stroke()
        this.ctxShadow.closePath()

        this.ctxShadow.lineWidth = this.lineWidth // thinner line
        // BEZIER CURVES FOR BOTH SIDES OF A LEAF
        this.ctxShadow.beginPath();
        this.ctxShadow.moveTo(this.shadowStages[this.currentStage].xFPetiole, this.shadowStages[this.currentStage].yFPetiole)
        // right side of a leaf
        this.ctxShadow.bezierCurveTo(this.shadowStages[this.currentStage].xR1, this.shadowStages[this.currentStage].yR1, this.shadowStages[this.currentStage].xR2, this.shadowStages[this.currentStage].yR2, this.shadowStages[this.currentStage].xF, this.shadowStages[this.currentStage].yF)
        this.ctxShadow.moveTo(this.shadowStages[this.currentStage].xFPetiole, this.shadowStages[this.currentStage].yFPetiole)
        // left side of a leaf
        this.ctxShadow.bezierCurveTo(this.shadowStages[this.currentStage].xL1, this.shadowStages[this.currentStage].yL1, this.shadowStages[this.currentStage].xL2, this.shadowStages[this.currentStage].yL2, this.shadowStages[this.currentStage].xF, this.shadowStages[this.currentStage].yF)
        this.ctxShadow.closePath()
        // this.ctxShadow.fillStyle = shadowColor
        this.ctxShadow.fillStyle = this.tree.shadowColorTree    
        this.ctxShadow.fill()
        this.ctxShadow.stroke()
    }
}
// ____________________________________________________ LEAF ____________________________________________________

// ____________________________________________________ INITIATIONS ____________________________________________________
let alreadyAnimating = false
// PLANT (SPAWN) TREE AT CLICK COORDS
canvasContainer.addEventListener("click", (event) => {
    if (alreadyAnimating === false && event.y > horizonHeight) {
        // console.log(event.y)
        // let verticalAngleInfluence = 1+ ( (this.window.innerHeight - event.y) / this.window.innerHeight ) ** 0.9
        // let shadowAngle = - (lightSourcePositionX - event.x) / window.innerWidth * shadowHorizontalStretch * verticalAngleInfluence
        let shadowAngle = - (lightSourcePositionX - event.x) / window.innerWidth * shadowHorizontalStretch
        let groundHeight = window.innerHeight - horizonHeight
        let groundMiddle = window.innerHeight - (window.innerHeight - horizonHeight)/2
        let scaleByTheGroundPosition = (event.y - groundMiddle)/groundHeight*2 // in range -1 to 1
        
        const colorDistortionProportion = 1 - ((event.y - horizonHeight) / groundHeight) // 1 - 0
        let colorInitial = blendRgbaColorsInProportions(mistColor, colorTreeInitialGlobal, colorDistortionProportion*treeMistBlendingProportion)
        let colorFinal = blendRgbaColorsInProportions(mistColor, colorTreeFinalGlobal, colorDistortionProportion*treeMistBlendingProportion)
        // NOW BLEND AGAIN WITH SHADOW
        colorInitial = blendRgbaColorsInProportions(shadowColorGlobal, colorInitial, colorDistortionProportion*treeShapeShadow)
        colorFinal = blendRgbaColorsInProportions(shadowColorGlobal, colorFinal, colorDistortionProportion*treeShapeShadow)

        // a color of the ground at the trunk bottom blended with shadow color
        let shadowColorTree = blendRgbaColorsInProportions(mistColor, groundColor, colorDistortionProportion*treeShadowBlendingProportion)
        shadowColorTree = blendRgbaColorsInProportions(shadowColorTree, shadowColorGlobal, colorDistortionProportion*treeShadowBlendingProportion)
        const vals = rgbaStrToObj(shadowColorTree)
        shadowColorTree = 'rgba(' + vals.r + ',' + vals.g  +',' + vals.b + ',1)' // alpha =1
                
        // _________ INITIALIZE THE TREE _________
        let treeTrunkScaledLength = trunkLen + trunkLen * scaleByTheGroundPosition * distanceScaling // normal scale at the half of ground canvas
        const tree = new Tree (event.x, event.y, treeTrunkScaledLength, shadowAngle, colorInitial, colorFinal, shadowColorTree, colorDistortionProportion)
        treesList.push(tree)
        animateTheTree(tree)
    }
})
// ____________________________________________________ INITIATIONS ____________________________________________________

// ____________________________________________________ MOUNTAIN ____________________________________________________

class Mountain {
    constructor (
        readonly initialAmountOfNodes: number,
        readonly octaves: number,
        readonly targetHeight: number,
        public canvasBottom: number,
        private colorTop: string,
        private colorBottom: string,
        private width = window.outerWidth * 1.02, // a little overlap for reassuring
        private lowestPoint = Infinity,
        private highestPoint = 0,
        private currentAmountOfNodes = initialAmountOfNodes,
        private currentOctave = 0,
        readonly allPoints = [] as number[],
        private randomPoints = [] as {x: number, y:number}[],
        readonly canvas = canvasContainer.appendChild(document.createElement("canvas")),
        readonly ctx = canvas.getContext('2d') as CanvasRenderingContext2D,
        readonly canvasShadow = canvasContainer.appendChild(document.createElement("canvas")),
        readonly ctxShadow = canvasShadow.getContext('2d') as CanvasRenderingContext2D,
    ){
        this.canvas.style.zIndex = String(Math.round(canvasBottom))
        this.canvasShadow.style.zIndex = this.canvas.style.zIndex

        this.currentAmountOfNodes = this.initialAmountOfNodes // to silence TS declared but never read
        while (this.currentOctave < this.octaves) {
            this.fillPointsOnTheLineBetweenNodes(this.currentAmountOfNodes)
            this.currentAmountOfNodes = this.currentAmountOfNodes * 2
            this.currentOctave ++
        }
        // console.log(this.randomPoints)
        // let generatedMountainHeight = highestPoint-lowestPoint
        this.rescale()
        this.smoothOut()
        this.allPoints = this.allPoints.slice(0, this.width) // trim array to initial width
        // this.drawMountain()

        this.ctx.lineWidth = 1
        this.canvas.style.bottom = (window.innerHeight - this.canvasBottom) + 'px'
        this.canvas.classList.add('mountainCanvas')
        this.canvas.width = window.innerWidth
        // this.canvas.height = this.highestPoint- this.lowestPoint
        this.canvas.height = this.targetHeight // ADD VAL FOR HIGHER MOUNTAIN

        this.canvasShadow.style.top = this.canvasBottom + 'px'
        this.canvasShadow.classList.add('mountainShadowCanvas')
        this.canvasShadow.height = this.targetHeight*shadowSpreadMountain * 2 // more area for blur
        this.canvasShadow.width = window.innerWidth

        this.ctx.globalCompositeOperation = 'destination-atop' // for drawing stroke in the same color as fill
        this.ctxShadow.globalCompositeOperation = 'destination-atop' // for drawing stroke in the same color as fill
        this.drawMountain()
        this.drawShadow()
    }

    fillPointsOnTheLineBetweenNodes (nodes_amount: number) {
        this.randomPoints = [] // clean up for next iteration
        let amplitude = this.initialAmountOfNodes**this.octaves /nodes_amount // has to be >1
        // console.log(amplitude)
        let stepLen = Math.ceil(this.width/(nodes_amount-1))
        // console.log(stepLen)
        let step = 0
        while (step*stepLen < this.width+stepLen) { // + stepLen to make one next step
            this.randomPoints.push({x:step*stepLen, y: Math.random()*amplitude })
            // console.log(step*stepLen)
            // step ++
            step ++
        }
        // FILL POINTS BETWEEN randomPoints
        for (let fillingStep =0; fillingStep < this.randomPoints.length-1; fillingStep++) {
            for (let currIndex = fillingStep*stepLen; currIndex < (fillingStep+1)*stepLen; currIndex++) {
                let thisNodeInfluence = ((fillingStep+1)*stepLen - currIndex) / stepLen // linearly decreasing 1-0
                let nextNodeInfluence = (currIndex - (fillingStep*stepLen)) / stepLen // linearly rising 0-1
                // allPoints[currIndex] = randomPoints[fillingStep].y * thisNodeInfluence + randomPoints[fillingStep+1].y * nextNodeInfluence
                if (this.currentOctave === 0) {
                    // console.log('fillingStep')
                    this.allPoints[currIndex] = this.randomPoints[fillingStep].y * thisNodeInfluence + this.randomPoints[fillingStep+1].y * nextNodeInfluence
                }
                else { //calculate average
                    this.allPoints[currIndex] += this.randomPoints[fillingStep].y * thisNodeInfluence + this.randomPoints[fillingStep+1].y * nextNodeInfluence
                }
            }
            // console.log('allPoints len = ' + this.allPoints.length)
        }
        // console.log('________________ allPoints len = ' + allPoints.length)
    }
    
    findMinAndMax () {
        for (let i = 0; i < this.allPoints.length; i++) {
            if (this.allPoints[i] < this.lowestPoint){
                this.lowestPoint = this.allPoints[i]
            }
            else if (this.allPoints[i] > this.highestPoint){
                this.highestPoint = this.allPoints[i]
            }
        }
    }

    // SMOOTHING BY AVERAGING NEIGHBOURING POINTS
    smoothOut() {
        for (let point = 1; point < this.allPoints.length-1; point++) {
            this.allPoints[point] = (this.allPoints[point-1] + this.allPoints[point] + this.allPoints[point+1])/3
        }
        //higher smoothness - averaging 5 points
        // for (let point = 2; point < this.allPoints.length-2; point++) {
        //     this.allPoints[point] = (this.allPoints[point-2] + this.allPoints[point-1] + this.allPoints[point] + this.allPoints[point+1] + this.allPoints[point+2])/5
        // }
    }

    rescale () {
        this.findMinAndMax ()
        let scalingFactor =  this.targetHeight / (this.highestPoint - this.lowestPoint)
        // console.log((this.highestPoint - this.lowestPoint))
        // console.log(scalingFactor)
        for (let i = 0; i < this.allPoints.length; i++) {
            this.allPoints[i] = (this.allPoints[i] - this.lowestPoint) * scalingFactor
        }
    }

    drawMountain () {
        this.ctx.lineWidth = 1
        const gradient = this.ctx.createLinearGradient(this.canvasShadow.width/2, 0, this.canvasShadow.width/2, this.canvas.height)
        gradient.addColorStop(0, this.colorTop)
        gradient.addColorStop(1, this.colorBottom)
        this.ctx.fillStyle = gradient
        this.ctx.strokeStyle = gradient
        this.ctx.stroke()
        // this.ctx.filter = 'blur(3px)'
        this.ctx.beginPath()
        this.ctx.moveTo(0, this.allPoints[0])
    
        for (let point = 0; point < this.allPoints.length-1; point++) {
            this.ctx.lineTo(point, this.allPoints[point])
            this.ctx.lineTo(point+1, this.allPoints[point+1])
        }
        this.ctx.lineTo(this.allPoints.length-1, this.allPoints[this.allPoints.length-1])
        this.ctx.lineTo(this.allPoints.length-1, this.highestPoint)
        this.ctx.lineTo(0, this.highestPoint)
        this.ctx.lineTo(0, this.allPoints[0])
        this.ctx.stroke()
        this.ctx.closePath()
        this.ctx.fill()

        // console.log(this.allPoints.length)

    }

    drawShadow () {
        const gradient = this.ctxShadow.createLinearGradient(this.canvasShadow.width/2, 0, this.canvasShadow.width/2, this.canvasShadow.height)
        gradient.addColorStop(0, this.colorBottom)

        const shadowColorValues =  rgbaStrToObj(shadowColorGlobal)
        const shadowColorTransparent = 'rgba(' + shadowColorValues.r + ',' + shadowColorValues.g +  ',' + shadowColorValues.b +  ',' + shadowColorValues.a/4 + ')'
        gradient.addColorStop(1, shadowColorTransparent)
        this.ctxShadow.fillStyle = gradient

        let h = this.targetHeight
        // this.ctxShadow.lineWidth = 1
        // let color = 'rgba(0,0,0, 0.5)'
        // this.ctxShadow.strokeStyle = color
        // this.ctxShadow.fillStyle = color
        this.ctxShadow.beginPath()
        this.ctxShadow.moveTo(0, h - this.allPoints[0])
        this.ctxShadow.filter = 'blur(5px)'
        // this.ctxShadow.stroke()

        for (let point = 0; point < this.allPoints.length-1; point++) {
            // let verticalAngleInfluence = ( (h - this.allPoints[point]) / h ) ** 0.7
            // let shadowAngle = - ((lightSourcePositionX - point) / window.innerWidth)/4 * shadowHorizontalStretch * verticalAngleInfluence
            let verticalAngleInfluence = ( (h - this.allPoints[point]) / h ) ** 1
            let shadowAngle = - ((lightSourcePositionX - point) / window.innerWidth) * shadowHorizontalStretch * verticalAngleInfluence
            // console.log(shadowAngle)
            this.ctxShadow.lineTo(point+ point*shadowAngle, (h - this.allPoints[point]) * shadowSpreadMountain)
            this.ctxShadow.lineTo(point+1 + (point+1)*shadowAngle, (h - this.allPoints[point+1]) * shadowSpreadMountain)
        }

        this.ctxShadow.lineTo(this.allPoints.length, (h - this.allPoints[this.allPoints.length]) * shadowSpreadMountain)
        this.ctxShadow.lineTo(this.allPoints.length, (h -  this.highestPoint) * shadowSpreadMountain)
        this.ctxShadow.lineTo(0, (h -  this.highestPoint) * shadowSpreadMountain)

        // this.ctxShadow.lineTo(0, (h -  this.allPoints[0]) * shadowSpreadMountain)
        this.ctxShadow.closePath()
        // this.ctxShadow.stroke()
        this.ctxShadow.fill()

    }

    redrawShadow () {
        this.ctxShadow.clearRect(0, 0, this.canvasShadow.width, this.canvasShadow.height)
        this.canvasShadow.height = this.targetHeight*shadowSpreadMountain*2 // resize canvas - more area for blur
        this.drawShadow()
    }

    recolorMountain () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        const groundHeight = window.innerHeight - horizonHeight
        const colorProportion = 1 - ((this.canvasBottom - horizonHeight) / groundHeight)
        let colorTop = blendRgbaColorsInProportions(mistColor, mountainColor, colorProportion)
        colorTop = rgbaSetAlpha1(colorTop)
        const colorProportionBottom = colorProportion * 1/2 + 1/4
        // const colorBottom = blendRgbaColorsInProportions(mistColor, shadowColor, colorProportion)
        let colorBottom = blendRgbaColorsInProportions(colorTop, shadowColorGlobal, colorProportionBottom)
        colorBottom = rgbaSetAlpha1(colorBottom)
        this.colorTop = colorTop
        this.colorBottom = colorBottom
        this.drawMountain()
    }

}
// _____________________ DRAWING MOUNTAINS _____________________
function drawMountains () {
    for (let m = 0; m < mountainsAmount; m++ ) {
        const height = 1000 * mountainHeightMultiplier * ((mountainsAmount - (m* mountainTrimCloser))/(mountainsAmount))
        const bottom = horizonHeight + (mountainRangeWidth/mountainsAmount) * m

        const groundHeight = window.innerHeight - horizonHeight
        // console.log(groundHeight)
        const colorProportion = 1 - ((bottom - horizonHeight) / groundHeight) // don't divide by 0 here (limit horizon)
        // console.log(colorProportion)
        const groundMiddle = window.innerHeight - (window.innerHeight - horizonHeight)/2
        const scaleByTheGroundPosition = (bottom - groundMiddle)/groundHeight * distanceScaling * 1.8
        // console.log(colorProportion) // 1 - 0
        let colorTop = blendRgbaColorsInProportions(mistColor, mountainColor, colorProportion)
        colorTop = rgbaSetAlpha1(colorTop)
        const colorProportionBottom = colorProportion * 1/2 + 1/4
        // const colorBottom = blendRgbaColorsInProportions(mistColor, shadowColor, colorProportion)
        let colorBottom = blendRgbaColorsInProportions(colorTop, shadowColorGlobal, colorProportionBottom)
        colorBottom = rgbaSetAlpha1(colorBottom)
        const mountain = new Mountain(4,10, height + height*scaleByTheGroundPosition, bottom, colorTop, colorBottom)
        // mountain //silence TS
        mountainsDrawn.push(mountain)
    }
}
drawMountains ()

function redrawMountains() {
    mountainsDrawn.forEach( mountain => {
        mountain.canvas.remove()
        mountain.canvasShadow.remove()
    })
    mountainsDrawn = []
    drawMountains ()
}

function recolorMountains() {
    mountainsDrawn.forEach( mountain => {
        mountain.recolorMountain()
        mountain.redrawShadow()
    })
}


// _____________________ DRAWING MOUNTAINS _____________________
// ____________________________________________________ MOUNTAIN ____________________________________________________

// ____________________________________________________ ANIMATION ____________________________________________________
function animateTheTree (tree: Tree) {
    document.body.style.cursor = 'wait' // waiting cursor
    alreadyAnimating = true
    let lvl = 0
    const start = Date.now()
    let lastTime = 0
    let accumulatedTime = 0
    const timeLimit = 10

    let branchesCompletedThisForEach = 0
    let branchesCompletedThisLvl = 0

    let currIndexLeaves = 0
    let whileLoopCounterLeaves = 0

    function animate(timeStamp: number,) {
        const timeDelta = timeStamp - lastTime
        lastTime = timeStamp

        // TILL whileLoopCounterLeaves = whileLoopRetriesLeaves AND growingLeavesList.length = 0
        while (whileLoopCounterLeaves <= whileLoopRetriesEachFrameLeaves && tree.growingLeavesList.length > 0) {
            // console.log('len = ' + growingLeavesList.length + ', indx = ' + currIndexLeaves)
            let leaf = tree.growingLeavesList[currIndexLeaves]

            // GROWING - DRAW
            if (leaf.state === "growing" && leaf.currentStage < leaf.maxStages) {
                leaf.drawLeafStage()
                leaf.currentStage ++
                currIndexLeaves ++
                if (Math.random() < leavesGrowingOrder) {currIndexLeaves--} // CHANCE TO DRAW THE SAME LEAF AGAIN.
                if (Math.random() < 1/100) {currIndexLeaves = 0} // CHANCE TO RESET INDEX TO 0
            }
            // GROWN - label as grown if maxStage reached
            else if (leaf.currentStage === leaf.maxStages) {
                leaf.drawLeafStage()
                leaf.currentStage ++
                leaf.state === "grown"
                // console.log('grwn')
                let spliceIndex = tree.growingLeavesList.indexOf(leaf)
                // remove already grown leaf from the growing list
                tree.growingLeavesList.splice(spliceIndex, 1) // 2nd parameter means remove one item only
                // currIndexLeaves--
            }
            // RESET currIndexLeaves if LAST LEAF from the list was reached
            if (currIndexLeaves === tree.growingLeavesList.length) {
                currIndexLeaves = 0
                // console.log('currIndexLeaves = 0')
            }
            whileLoopCounterLeaves ++
            // console.log(growingLeavesList.length)
        }
        whileLoopCounterLeaves = 0

        // ________________ BREAK THE LOOP ________________
        if (lvl > tree.maxLevel && tree.growingLeavesList.length === 0 ) {
            console.log('___ Animation in ' + (Date.now() - start) + ' ms ___')
            // console.log(growingLeavesList)
            alreadyAnimating = false
            // accumulatedTime = 0
            document.body.style.cursor = 'auto' // remove waiting cursor
            return
        }

        // OR ACCUMULATE PASSED TIME
        else if (accumulatedTime < timeLimit){
            accumulatedTime += timeDelta
        }

        // DRAW A FRAME IF TIMELIMIT PASSED
        // else if (accumulatedTime >= timeLimit && lvl <= tree.maxLevel){

        // WAIT TILL growingLeavesList.length < growgrowLimitingLeavesAmountAmount to draw further segments
        else if (accumulatedTime >= timeLimit  &&  lvl <= tree.maxLevel  &&  tree.growingLeavesList.length <= growLimitingLeavesAmount){
            // for every branch
            tree.allBranches[lvl].forEach(branch => {
                // if this branch is completly drawn 
                if (branch.drawnSegments >= branch.segments.length) {
                    branchesCompletedThisForEach ++
                }
                // if not, draw it
                else if (branch.drawnSegments < branch.segments.length) {
                    branch.drawBranchBySegments()
                    accumulatedTime = 0
                }
            }) // forEach end
            branchesCompletedThisLvl = branchesCompletedThisForEach
            branchesCompletedThisForEach = 0

            // go next level if completed all the branches at this frame
            if (branchesCompletedThisLvl === tree.allBranches[lvl].length){
                branchesCompletedThisLvl = 0
                lvl++
            // console.log('lvl = ' + lvl)
            }
        }
        requestAnimationFrame(animate)

        // if (Math.floor(1000/timeDelta) < 50){
        //     console.log(Math.floor(1000/timeDelta) + ' FPS!!!') // FPS ALERT
        // }
    }
    animate(0)
}

// ____________________________________________________ ANIMATION ____________________________________________________






}) //window.addEventListener('load', function(){ }) ENDS HERE