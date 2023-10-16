# Probabilistic Land - TypeScript
This project started as a tree generating algorithm, but I added shadows, mountains etc. on top of that because plain background didn't look well. So here it is. No libraries etc. used - just pure TypeScript, CSS and a little bit of HTML.

<p align="center">
  <img src="https://github.com/HeatGub/TS-Probabilistic-Land/assets/115884941/809eac02-a677-46c7-b7cc-a664bcd7398d" width=60%>
</p>

## Overview
- Over **50 parameters** to change (perspective, shadows, tree parameters, colors, etc.)
- New set of **random parameters** with each site **refresh**
- Move the **lightsource** to change **shadows** direction
- **Plant the tree** by clicking on the ground
- Cancel tree growing or **remove** it completely (ctrl + z)

<p align="center">
  <img src="https://github.com/HeatGub/TS-Probabilistic-Land/assets/115884941/98e37808-b9f5-4dae-878a-1a1c9c9dd42d" width=70%>
</p>


## Mountains
Mountains are made of 1-dimensional **Perlin noise**. You can choose the amount of the mountains, their height, width, colors etc. Mountain color parameter works for closer mountains, since furthest are mist-colored.

<p align="center">
  <img src="https://github.com/HeatGub/TS-Probabilistic-Land/assets/115884941/93bad820-ff89-4f2e-b86c-014087e7adf8" width=70%>
</p>

## Trees
Click **LMB on the ground** to plant a tree.

<p align="center">
  <img src="https://github.com/HeatGub/TS-Probabilistic-Land/assets/115884941/068e1e6a-5942-4c06-8c48-bbe6f3c474b2" width=60%>
</p>

Trees generating algorithm relies on **fractal tree** algorithm, but it's heavily **randomized**. Moreover, each branch is divided into **segments**, and each segment can have different width and different amount of leaves. Additionally, an **"occasional" branch** can appear at the middle segments of parent branch (not only at the branch tip like in the fractal version).

<p align="center">
  <img src="https://github.com/HeatGub/TS-Probabilistic-Land/assets/115884941/831b9745-7733-4735-9873-90e1193465bb" width=70%>
</p>

Trees are made in 2 steps:
- Constructing the tree (calculating all the positions of all the branches' segments and their leaves + shadows)
- Animating the tree in the right order (first trunk, then its children branches, then their children branches and so on).

Check the console to see the statistics:
<p align="center">
  <img src="https://github.com/HeatGub/TS-Probabilistic-Land/assets/115884941/c8692c60-d85a-4d90-bdc5-6039bde37ed6" width=35%>
</p>

## Leaves
Leaves are made of a **main nerve** (just a line) and 2 **Bezier curves** at its sides. One curve is for the left side and another is for the right side of a leaf. 

**Each bezier curve is stretched along four points:**
- First point is where the main nerve connects with a leaf blade (petiole's end). 
- Second point is at the corresponding site of the first axis (closer to petiole), which is perpendicular to the main nerve.
- Third point is at the corresponding site of the second axis (further to petiole), which is also perpendicular to the main nerve.
- Fourth point is main nerve's end

By changing axes position and width you can change the shape of a leaf.
By moving the axes to the side (left or right side of a leaf), the leaf seems folding (leaf folding parameter), although it will move the axes to the appropriate side automatically (parameter value changes only the strength of that effect).

<p align="center">
  <img src="https://github.com/HeatGub/TS-Probabilistic-Land/assets/115884941/f1a21cda-1210-48ef-8440-009e00cafa3a" width=70%>
</p>

## Performance & Control
Animation time depends on number of segments (of branches), leaves, shadow's and tree's position.
You can cancel animation anytime - **(ctrl + z)**

There are few steps to maximize animation speed, and it's up to a case which ones are optimal.
- Plant a tree at coordinates that place **shadow out of drawing window**. This way shadow won't be drawn so the animation will be faster
- Decrease **"Tree Shadow Blur"** - Values higher than 0 may heavily slow down the animation
- Increase **"Branch Segment Length"** (branches will be less smooth)
- Decrease **"Branching Booster"** and **"Occasional Branches Limit"** (less branches)
- Decrease **"Leafy Levels"** and **"Leaf Probability"** (less leaves)
- Increase **"Leaf animation Pack"** (leaf draw attempts in each frame. Lower value gives more stable but slower animation.)
- Decrease **"Leaf Growth Stages"** (fully grown leaf in less time, but no growing effect)

<p align="center">
  <img src="https://github.com/HeatGub/TS-Probabilistic-Land/assets/115884941/73e93387-e8f4-4ee2-bbce-7db3440a3ba0" width=70%>
</p>

## Even more screenshots!
<p align="center">
  <img src="
https://github.com/HeatGub/TS-Probabilistic-Land/assets/115884941/835ecdbf-c94f-484d-a4fb-1ef0629b0f65" width=70%>
</p>
<p align="center">
  <img src="https://github.com/HeatGub/TS-Probabilistic-Land/assets/115884941/3bfc6f40-4c7e-4e77-bf75-855e45ce5c62" width=70%>
</p>
<p align="center">
  <img src="https://github.com/HeatGub/TS-Probabilistic-Land/assets/115884941/e76cc86b-f503-491c-960d-a4b0809ba04a" width=70%>
</p>

Folks, that's all.