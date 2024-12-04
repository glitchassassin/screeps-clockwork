export function getFlagPositionsByRoom(color1: ColorConstant, color2: ColorConstant) {
  return Object.values(Game.flags).reduce(
    (acc, flag) => {
      if (flag.color === color1 && flag.secondaryColor === color2) {
        acc[flag.pos.roomName] ??= [];
        acc[flag.pos.roomName].push(flag.pos);
      }
      return acc;
    },
    {} as Record<string, RoomPosition[]>
  );
}
