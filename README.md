## Hyperledger L2

We can consider this as a traditional data storing in the database - It is like a table, indexed with a
Gadget Identifier (gadgetId), and stores the information of Make, Model, Color and Owner for this
gadget

- User can create a gadget record.
- Fetch all the records.
- Change the ownership of a gadget record

### Prerequisites and setup:

- [Docker](https://www.docker.com/products/overview) - v1.12 or higher
- [Docker Compose](https://docs.docker.com/compose/overview/) - v1.8 or higher
- **Node.js** v8.4.0 or higher
- [Download Docker images](http://hyperledger-fabric.readthedocs.io/en/latest/samples.html#binaries)

Once you have completed the above setup, you will have provisioned a local network with the following docker container configuration:

- 2 CAs
- A SOLO orderer
- 4 peers (2 peers per Org)

## Running the sample program

There are two options available for running the sample. The chaincode is written in Nodde.js

### Option 1:

##### Terminal Window 1

- Launch the network using docker-compose

```
docker-compose -f artifacts/docker-compose.yaml up
```

##### Terminal Window 2

- Install the fabric-client and fabric-ca-client node modules

```
npm install
```

- Start the node app on PORT 4000

```
PORT=4000 node app
```

##### Terminal Window 3

- Execute the REST APIs from the section [Sample REST APIs Requests]

### Option 2:

##### Terminal Window 1

```

./runApp.sh

```

- This launches the required network on your local machine
- Installs the fabric-client and fabric-ca-client node modules
- And, starts the node app on PORT 4000

##### Terminal Window 2

In order for the following shell script to properly parse the JSON, you must install `jq`:

instructions [https://stedolan.github.io/jq/](https://stedolan.github.io/jq/)

With the application started in terminal 1, next, test the APIs by executing the script - **testAPIs.sh**:

```

./testAPIs.sh
```

## Sample REST APIs Requests

### Login Request

- Register and enroll new users in Organization :

  1. **Org1** -
     `curl -s -X POST http://localhost:4000/users -H "content-type: application/x-www-form-urlencoded" -d 'username=Jim&orgName=Org1'`
  2. **Org2** -
     `curl -s -X POST http://localhost:4000/users -H "content-type: application/x-www-form-urlencoded" -d 'username=Tom&orgName=Org2'`

**OUTPUT:**

```
{
  "success": true,
  "secret": "RaxhMgevgJcm",
  "message": "Jim enrolled Successfully",
  "token": "<put JSON Web Token here>"
}
```

The response contains the success/failure status, an **enrollment Secret** and a **JSON Web Token (JWT)** that is a required string in the Request Headers for subsequent requests.

### Create Channel request

Can be called by using either Org JWT Token

```
curl -s -X POST \
  http://localhost:4000/channels \
  -H "authorization: Bearer <put JSON Web Token here>" \
  -H "content-type: application/json" \
  -d '{
	"channelName":"mychannel",
	"channelConfigPath":"../artifacts/channel/mychannel.tx"
}'
```

Please note that the Header **authorization** must contain the JWT returned from the `POST /users` call

### Join Channel request

1. **Org1** -

```
curl -s -X POST \
  http://localhost:4000/channels/mychannel/peers \
  -H "authorization: Bearer <put JSON Web Token here>" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org1.example.com","peer1.org1.example.com"]
}'
```

2. **Org2** -

```
curl -s -X POST \
  http://localhost:4000/channels/mychannel/peers \
  -H "authorization: Bearer <put JSON Web Token here>" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org2.example.com","peer1.org2.example.com"]
}'
```

### Install chaincode

1. **Org1** -

```
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "authorization: Bearer <put JSON Web Token here>" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org1.example.com","peer1.org1.example.com"],
	"chaincodeName":"mycc",
	"chaincodePath":"./artifacts/src/github.com/example_cc/node",
	"chaincodeType": "node",
	"chaincodeVersion":"v0"
}'
```

2. **Org2** -

```
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "authorization: Bearer <put JSON Web Token here>" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org2.example.com","peer1.org2.example.com"],
	"chaincodeName":"mycc",
	"chaincodePath":"./artifacts/src/github.com/example_cc/node",
	"chaincodeType": "node",
	"chaincodeVersion":"v0"
}'
```

### Instantiate chaincode

This is the endorsement policy defined during instantiation.
This policy can be fulfilled when members from both orgs sign the transaction proposal.
The instantiation also creates 2 sets of data points in the ledger for sample purpose.

```
{
	identities: [{
			role: {
				name: 'member',
				mspId: 'Org1MSP'
			}
		},
		{
			role: {
				name: 'member',
				mspId: 'Org2MSP'
			}
		}
	],
	policy: {
		'2-of': [{
			'signed-by': 0
		}, {
			'signed-by': 1
		}]
	}
}
```

```
curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes \
  -H "authorization: Bearer <put JSON Web Token here>" \
  -H "content-type: application/json" \
  -d '{
	"chaincodeName":"mycc",
	"chaincodeVersion":"v0",
	"chaincodeType": "node",
	"args":[]
}'
```

### Invoke request

This invoke request is signed by peers from both orgs, _org1_ & _org2_.

#### Create Gadget

createGadget function is used for creating a new entry in the ledger.

```
curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/mycc \
  -H "authorization: Bearer <put JSON Web Token here>" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org1.example.com","peer0.org2.example.com"],
	"fcn":"createGadget",
	"args":["GD2","Black","Asus","ROG","Karl"]
}'
```

#### Update Owner

updateOwner function is used for updating an existing entry in the ledger.

```
curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/mycc \
  -H "authorization: Bearer <put JSON Web Token here>" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org1.example.com","peer0.org2.example.com"],
	"fcn":"changeOwner",
	"args":["GD2","Katy"]
}'
```

### Chaincode Query

This is used to query all the data entries stored in the ledger.

```
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/mycc?peer=peer0.org1.example.com&fcn=queryAll&args=%5B%5D" \
  -H "authorization: Bearer <put JSON Web Token here>" \
  -H "content-type: application/json"
```

## Clean the network

The network will still be running at this point. Before starting the network manually again, here are the commands which cleans the containers and artifacts.

```
docker rm -f $(docker ps -aq)
docker rmi -f $(docker images | grep dev | awk '{print $3}')
rm -rf fabric-client-kv-org[1-2]
```
