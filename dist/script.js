"use strict";
// ______________ CURRENT ______________
window.addEventListener('load', function () {
    //GLOBALS
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 800;
    ctx.strokeStyle = 'brown';
    class Branch {
        constructor(x0, y0, len, angle, lineWidth = 16, //trunk width
        xF = 0, //could be ? but then lineTo errors with null
        yF = 0, level = 0, parent, // parent branch
        children = []) {
            this.x0 = x0;
            this.y0 = y0;
            this.len = len;
            this.angle = angle;
            this.lineWidth = lineWidth;
            this.xF = xF;
            this.yF = yF;
            this.level = level;
            this.parent = parent;
            this.children = children;
            // CALCULATE TIP (FINAL) COORDINATES
            this.xF = x0 + Math.sin(angle / 180 * Math.PI) * len;
            this.yF = y0 - Math.cos(angle / 180 * Math.PI) * len;
        }
        makeChildrenBranch(angleDiff) {
            ctx.strokeStyle = 'green'; // why is the trunk green?
            let childBranch = new Branch(this.xF, this.yF, this.len * 0.8, angleDiff, this.lineWidth * 0.7);
            childBranch.level = this.level + 1;
            childBranch.parent = this;
            this.children.push(childBranch);
            console.log(childBranch);
            this.drawBranch(childBranch);
        }
        drawBranch(object) {
            ctx.lineWidth = object.lineWidth;
            ctx.moveTo(object.x0, object.y0);
            ctx.lineTo(object.xF, object.yF);
            ctx.stroke();
        }
    }
    let branch = new Branch(canvas.width / 2, canvas.height, 200, 0);
    console.log(branch);
    branch.drawBranch(branch);
    branch.makeChildrenBranch(10);
    branch.makeChildrenBranch(-10);
});
// ______________ CURRENT ______________
//# sourceMappingURL=script.js.map