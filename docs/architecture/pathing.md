# Generating Paths

We might want to generate a path:

1. Based on an origin and a flow field/distance map to a destination (perhaps specified with a target range)
2. Based on a flow field/distance map and one or more destinations (reversing the distance map to find the closest).
3. Based on an origin, a cost matrix, and one or more destinations (perhaps specified with a target range)

## Origin + Flow Field

1. Find the origin in the flow field.
2. Follow the direction(s) in the flow field to move to the next tile, adding it to the path.

- Multi-directional flow field variants:
  - Cheapest: Pick from multiple directions deterministically based on min direction
  - Aesthetic: Pick from multiple directions deterministically based on closest angle to the destination
  - Distributed: Pick from multiple directions randomly to distribute traffic

3. If the destination is in range, return the path. If a point already on the path is found, throw an error (invalid flow field). If we run out of directions, throw an error (invalid flow field).

## Flow Field/Distance Map + Destination(s)

We can navigate backwards on a flow field or distance map to one (flow field) or multiple (distance map) destinations. It's inefficient to reverse-path to a destination with a range - we'd have to check each tile within that range of the destination to decide which is actually closest on the distance map.

1. If a distance map, pick the closest of multiple destinations by looking up the distance value at each and taking the minimum.
2. Starting at the target destination, follow the lowest adjacent distance values (distance map) or directions (flow field) back to the origin, using the logic above.
3. Return the path, reversed.

## Origin + Cost Matrix + Destination(s)

1. Starting from the origin, generate a distance map to the closest destination, stopping at the first tile in range.
2. Follow it back to the origin, using the logic above in case of multiple directions.
3. Return the path, reversed.
