# Traffic Management

Sometimes (especially at early stages in a room's lifecycle, before extensions can support large creeps) traffic becomes an issue: some creeps standing idle, some busily working in a defined area, many others going different directions.

## Standing Idle

Idle creeps mostly don't care where they are (though they might want to avoid being shoved outside a rampart boundary). When another creep needs to pass through their square, the idle creep should move to a vacant square.

This can be recursive if many idle creeps are clustered together - one on the outside needs to move to open a hole for the inner ones to shift out of the way.

Every idle creep that moves is an extra intent, so the fewer that move to make a hole, the better. If the creep can be shoved somewhere _other_ than a future point on the shover's path, even better.

Sometimes the shover can just swap places with the idle creep, but that does leave it on the path to impede future traffic.

## Stationary creeps

Sometimes multiple creeps will be at work in a specific area (harvesters in range of a source, upgraders in range of a controller, etc.) These don't always care where they are as long as they are in range of the target.

Sometimes they do _prefer_ to stay close to a secondary point within that range - a container they refill from perhaps - but not as a hard rule. In this case, they should attempt to shove to stay in that range, but should not override another creep's equal or higher priority preference (shoving another of the same creeps away from the container). This might be too much of an optimization, though: you can get similar results by just defining a target move area in range of the controller, close to the container, and with enough area to accommodate all upgraders.

Should a higher-priority creep ever be able to shove a stationary creep out of position?

The answer might be situational. Maybe a combat creep needs to displace a harvester to defend the room.

It's easier to block critical squares from combat creeps' cost matrixes than to detect when a stationary creep needs to move _outside_ traffic management.

So, if a higher-priority creep is moving to a square occupied by a creep with no other possible moves, it should shove it anywhere.

But maybe "anywhere" isn't ideal: if inside ramparts, it might be safer to move somewhere within than outside.

## Moving Creeps

Generally, moving creeps are following a defined path (probably on a road) and don't have the option of being shoved in a different direction.

Following a flow-field can give moving creeps more options, so that multiple creeps with overlapping target tiles could each find a place to move closer to their goal.

## Pulling Creeps

When one or more creeps are being pulled, shoving breaks the train, and may make recovery difficult. A pulling creep's square should be considered blocked even for higher-priority creeps. Don't break the train!

# Optimal Traffic Management

Every move intent, whether or not it's later overridden, costs CPU. So, we want to delay move intents until the end of the tick (at least until all move actions have been registered.)

Most creeps don't need traffic management if there is no collision. We can detect conflicts along the way. (We need to consider "move to a square where a creep is" as a conflict, though it may resolve itself if the creep is also moving.)

When a conflict is detected (on adding a new move intent), we can collect just the relevant creeps and de-conflict them.

# Relevant Traffic Data

Move:

- Creep
- Target squares (maybe with preference order)
- Move priority

The logic here is going to need to be spelled out in detail including different scenarios with shoving, priority conflicts, etc. But I think it's probably still going to look something like Cartographer.
