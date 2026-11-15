# Jumpion

Help a fallen star get back home. Answer seven questions and finish at 180 m or higher.

## Play

1. Open Godot 4.6 and click **Import**.
2. Pick `project.godot` and press **F5**.
3. Type a guess and press **Enter**. The three most obvious guesses cost 20 m. A less common guess adds 10 m. Rarer guesses give you a trampoline jump worth 30, 60 or 100 m.
4. Try another guess or click **Skip** if the game doesn't know your answer.

## Edit

Change the questions and guesses in `answers.json`. Write answers like `couch|sofa` when both spellings or words should count.

`main.gd` handles the questions, score and dialogue. `movement.gd` moves Jumpion and the camera. Open `main.tscn` to edit the screen and animations.

The star and trampoline use 64 × 64 PNGs. Open `star.kra` in Krita to edit the star. The scrolling level is in `map.webp`.

Starfield art adapted from Kenney's [Space Shooter Redux](https://lpc.opengameart.org/content/space-shooter-redux) (CC0).
