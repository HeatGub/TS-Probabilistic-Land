"use strict";
window.addEventListener('load', function () {
    //GLOBALS
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    //  SET CANVAS SIZES AND CHANGE THEM AT WINDOW RESIZE
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        tree.drawTheTree(); // tree possibly not ready at resizes
    });
    class Branch {
        constructor(x0, y0, len, angle, lineWidth = 20, //trunk width
        parent, // parent branch or root
        xF = 0, //could be ? but then lineTo errors with null
        yF = 0, level = 0, children = []) {
            this.x0 = x0;
            this.y0 = y0;
            this.len = len;
            this.angle = angle;
            this.lineWidth = lineWidth;
            this.parent = parent;
            this.xF = xF;
            this.yF = yF;
            this.level = level;
            this.children = children;
            this.parent = parent;
            // recalculate the angle according to parent branch first 
            this.angle = this.parent.angle + this.angle;
            // THEN CALCULATE TIP (FINAL) COORDINATES
            this.xF = x0 + Math.sin(this.angle / 180 * Math.PI) * len;
            this.yF = y0 - Math.cos(this.angle / 180 * Math.PI) * len;
        }
        makeChildBranch(parent, angleDiff) {
            // ctx.strokeStyle = 'green' // why is the trunk green?
            let childBranch = new Branch(this.xF, this.yF, this.len * 0.8, angleDiff, this.lineWidth * 0.6, parent);
            childBranch.parent = this;
            childBranch.level = this.level + 1;
            this.children.push(childBranch);
            // console.log(this.parent)
            // childBranch.drawBranch()
            // setTimeout(() => {childBranch.drawBranch()} , 50)
            return childBranch;
        }
        drawBranch() {
            // console.log(this)
            ctx.lineWidth = this.lineWidth;
            ctx.strokeStyle = 'rgb(10,' + 20 * this.level + ', 0)';
            ctx.moveTo(this.x0, this.y0);
            ctx.lineTo(this.xF, this.yF);
            // ctx.fillStyle = 'white'
            // ctx.fillText(String(this.angle) + '  ' + String(this.level), (this.xF+this.x0)/2 + 10, (this.y0+this.yF)/2)
            ctx.stroke();
            return;
        }
    }
    class Tree {
        constructor(initX, initY, initLen, initAngle, maxLevel = 10, everyLevelBranches = [[]]) {
            this.initX = initX;
            this.initY = initY;
            this.initLen = initLen;
            this.initAngle = initAngle;
            this.maxLevel = maxLevel;
            this.everyLevelBranches = everyLevelBranches;
            const startTime = Date.now();
            this.everyLevelBranches[0] = [new Branch(initX, initY, initLen, initAngle, 50, root)]; //save trunk as 0lvl branch
            // this.everyLevelBranches[0][0].drawBranch()     //draw the trunk
            for (let currLvl = 0; currLvl < this.maxLevel; currLvl++) {
                this.everyLevelBranches.push([]); // push empty array to fill it by the forEach loop
                this.everyLevelBranches[currLvl].forEach(element => {
                    // MAKE BRANCHES
                    if (Math.random() > 0.1) {
                        this.everyLevelBranches[currLvl + 1].push(element.makeChildBranch(element, 25));
                    }
                    if (Math.random() > 0.1) {
                        this.everyLevelBranches[currLvl + 1].push(element.makeChildBranch(element, -25));
                    }
                });
            }
            console.log('Tree constructed in ' + (Date.now() - startTime) + ' ms');
        } // constructor end
        drawTheTree() {
            const startTime = Date.now();
            for (let currLvl = 0; currLvl < this.maxLevel; currLvl++) {
                this.everyLevelBranches.push([]); // push empty array to fill it by the forEach loop
                this.everyLevelBranches[currLvl].forEach(element => {
                    element.drawBranch();
                });
            }
            console.log('Tree painted in ' + (Date.now() - startTime) + ' ms');
        }
    }
    class Root {
        constructor(angle = 0) {
            this.angle = angle;
        }
    }
    // _________ INITIALIZE THE TREE _________
    // Root just acts as a parent element for the trunk. 
    // With the root there is no need for checking for parent element in Branch constructor
    const root = new Root();
    const tree = new Tree(canvas.width / 2, canvas.height, 200, 0); // initialize tree with trunk params
    tree.drawTheTree();
    // console.log(tree.everyLevelBranches)
    // // ANIMATE
    // let lastTime = 0
    // function animate(timeStamp: number) {
    //     const deltaTime = timeStamp - lastTime
    //     lastTime = timeStamp
    //     ctx.clearRect(0,0, canvas.width, canvas.height)
    //     game.render(ctx, deltaTime)
    //     // console.log(Math.floor(1000/deltaTime)) //FPS
    //     requestAnimationFrame(animate)
    // }
    // //run animation loop, first time stamp as argument
    // animate(0)
});
//# sourceMappingURL=script.js.map