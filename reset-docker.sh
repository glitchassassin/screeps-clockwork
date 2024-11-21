docker compose down -v --remove-orphans
docker compose up -d
until docker compose run --rm curl -X POST http://localhost:21028/cli -d 'system.resetAllData()'; do
  echo "Waiting for server..."
  sleep 10
done
docker compose restart screeps
until docker compose run --rm curl -X POST http://localhost:21028/cli -d 'utils.addNPCTerminals()'; do
  echo "Waiting for server..."
  sleep 5
done
docker compose run --rm curl -X POST http://localhost:21028/cli -d 'storage.db["rooms.objects"].insert({ room: "W0N5", type: "portal", x: 25, y: 25, destination: { x: 25, y: 25, room: "W10N5" } });'
docker compose run --rm curl -X POST http://localhost:21028/cli -d 'storage.db["rooms.objects"].insert({ room: "W10N5", type: "portal", x: 25, y: 25, destination: { x: 25, y: 25, room: "W0N5" } });'
docker compose run --rm curl -X POST http://localhost:21028/cli -d 'storage.db["rooms.objects"].removeWhere({type:"invaderCore"})'
docker compose run --rm curl -X POST http://localhost:21028/cli -d 'storage.db["rooms.objects"].insert({type:"ruin",room:"W6N4",x:25,y:32,structure:{ id: "652eb0d77373ad0040d22421",type: "invaderCore", hits: 0,hitsMax: 100000,user: "2"},user:"2",store:{},destroyTime:1,decayTime:5000000})'
docker compose run --rm curl -X POST http://localhost:21028/cli -d 'system.pauseSimulation()'
until docker compose run --rm curl -s http://client:8080/#!/map -o /dev/null; do
  echo "Waiting for client..."
  sleep 5
done
docker compose run --rm curl -X POST http://client:8080/api/register/submit -H 'Content-Type: application/json' -d '{"email":"jon.winsley@gmail.com","password":"passw0rd","username":"LordGreywether","tutorialDone":false,"modules":{},"branches":[]}'
docker compose run --rm curl -X POST http://localhost:21028/cli -d 'utils.setCPULimit("LordGreywether", 500)'
