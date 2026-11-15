# Jumpion

Help a fallen star get back home. Answer seven questions and finish at 180 m or higher.

## Play in Godot

1. Open Godot 4.6 and click **Import**.
2. Choose `project.godot` in this folder and press **F5**.
3. Type a guess and press **Enter**. Any of the three obvious guesses for a question costs 20 m, and your height bottoms out at zero. Other answers on the list give you 10, 30 or 60 m. The first question also has a hidden 100 m answer.
4. If your guess is missing from the list, try another or press **Skip**. Use **Next question** to move on. After the last question you can see your result and play again.

## Edit the game

| File | What to change |
| --- | --- |
| `answers.json` | The seven questions and their answer lists. Use a pipe to list alternatives for the same answer, like `couch\|sofa`. The lists set the scores. |
| `main.gd` | The rules, scoring, questions and ending. |
| `trampoline.gd` | Starts the animations and moves the star and camera the right number of meters. |
| `main.tscn` | The layout and keyframes. In Godot, select **Stage → AnimationPlayer** to preview the fall, toss, release and stumble. Select **Stage → Jumpion → FloatAnimation** for the idle animation. |

## Drawings

The game uses the existing star and trampoline PNGs. Both are 64 × 64 pixels. Godot animates their position, rotation and scale, so one image per object works.

- **Star** — If you want a new version, export a transparent 64 × 64 PNG as `star charcter.png`. The current star can be edited in `Star Charcter.kra` with Krita.
- **Trampoline** — If you redraw it, export a transparent 64 × 64 PNG as `Trampoline.png`.
- **Background (optional)** — If you want a custom sky, draw a 960 × 600 PNG as `sky.png`. Leave the left side fairly open for the questions. The current scene uses a solid background.

To keep the existing animations lined up, open each original sprite as a layer and draw your replacement in the same spot on the canvas.
