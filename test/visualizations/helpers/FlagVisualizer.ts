/**
 * A visualizer matches flags by primary/secondary color. It has a run() method to display the visualization.
 *
 * The visualization manager also displays a helper visualization with the names of visualizers and
 * the corresponding flag colors.
 */
export type FlagVisualizer = {
  color1: ColorConstant;
  color2: ColorConstant;
  name: string;
  run: (flags: Record<string, Flag[]>) => void;
};

const COLOR_LIST: Record<ColorConstant, string> = {
  [COLOR_RED]: '#F44336',
  [COLOR_PURPLE]: '#9C27B0',
  [COLOR_BLUE]: '#2196F3',
  [COLOR_CYAN]: '#00BCD4',
  [COLOR_GREEN]: '#4CAF50',
  [COLOR_YELLOW]: '#FFEB3B',
  [COLOR_ORANGE]: '#FF9800',
  [COLOR_BROWN]: '#795548',
  [COLOR_GREY]: '#9E9E9E',
  [COLOR_WHITE]: '#ffffff'
};

export function runVisualizers(visualizers: FlagVisualizer[]) {
  const viz = new RoomVisual();
  for (let i = 0; i < visualizers.length; i++) {
    const visualizer = visualizers[i];
    // display the visualizer name and colors
    const x = 1;
    let font_size = 0.2;
    const y = i * (font_size + 0.2);
    const rect_width = font_size + 0.2;
    const rect_height = (font_size + 0.2);
    viz.rect(x, y, rect_width, rect_height, {
      fill: COLOR_LIST[visualizer.color1],
      opacity: 1
    });
    viz.rect(x + rect_width, y, rect_width, rect_height, {
      fill: COLOR_LIST[visualizer.color2],
      opacity: 1
    });
    viz.text(visualizer.name, x + rect_width * 2 + 0.2, y + font_size + 0.05, { font: font_size, align: 'left' });

    // fetch the flags and run the visualizer
    const flags = Object.values(Game.flags).reduce(
      (acc, flag) => {
        if (flag.color === visualizer.color1 && flag.secondaryColor === visualizer.color2) {
          acc[flag.pos.roomName] ??= [];
          acc[flag.pos.roomName].push(flag);
        }
        return acc;
      },
      {} as Record<string, Flag[]>
    );

    if (Object.keys(flags).length > 0) {
      visualizer.run(flags);
    }
  }
}
