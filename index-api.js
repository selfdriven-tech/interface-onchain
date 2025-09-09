/*
	SELFDRIVEN ON-CHAIN API;
	https://selfdriven.foundation/apps#apis

	On-Chain Util Functions
	See Spec Doc @
	https://docs.google.com/document/d/1g1XPtfjw5grLjewrJKt0u1pnLm3dBesdunlmUD_T1LA

	Methods:
	generate-mnemonic
	generate-wallet
	generate-account
	verify-signed-data
	verify-signed-data-policy
	verify-user-auth
	get-protocol-parameters

	Internal methods:
	verify-signed-data-policy

	!!!! Merging in index-blockchain.js

	Depends on;
	https://learn.entityos.cloud/learn-function-automation

	---

	This is a lambda compliant node app with a wrapper to process data from API Gateway & respond to it.

	To run it on your local computer your need to install
	https://www.npmjs.com/package/lambda-local and then run as:

	lambda-local -l index.js -t 9000 -e event.json

	API Gateway docs:
	- https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html
	
	Authentication:
	Get apikey in the event data, and using user in settings.json get the username based on matching GUID
	The use the authKey in the event data as the password with the username.
	!! In production make sure the settings.json is unrestricted data with functional restriction to setup_user
	!!! The apiKey user has restricted data (based on relationships) and functional access

	Event Data:
	{
	  "body": {
	    "apikey": "e7849d3a-d8a3-49c7-8b27-70b85047e0f1"
	  },
	  "queryStringParameters": {},
	  "headers": {}
	}

	event/passed data available via request contect in the app scope.
	eg
		var request = entityos.get(
		{
			scope: 'app',
			context: 'request'
		});
		
		>

		{ 
			body: {},
			queryString: {},
			headers: {}
		}

	"app-auth" checks the apikey sent against users in the space (as per settings.json)
	
	Run:
	lambda-local -l index-api.js -t 9000 -e event-api-lab.json
	lambda-local -l index-api.js -t 9000 -e event-api-verify-signed-data-lab.json
	lambda-local -l index-api.js -t 9000 -e event-api-verify-signed-data-policy-lab.json
	lambda-local -l index-api.js -t 9000 -e event-api-generate-wallet-lab.json
	lambda-local -l index-api.js -t 9000 -e event-api-generate-hash-lab.json

	lambda-local -l index-api.js -t 9000 -e event-api-generate-account-lab.json
	
	lambda-local -l index-api.js -t 9000 -e event-api-verify-user-auth-lab.json
	lambda-local -l index-api.js -t 9000 -e event-api-util-keys.json

	lambda-local -l index-api.js -t 9000 -e event-api-get-protocol-parameters.json

	lambda-local -l index-api.js -t 9000 -e event-api-verify-signed-data-policy-internal-lab.json
	lambda-local -l index-api.js -t 9000 -e event-api-generate-transaction-lab.json

	Upload to AWS Lambda:
	zip -r ../selfdriven-onchain-api-DDMMMYYYY.zip *
*/

exports.handler = function (event, context, callback)
{
	var entityos = require('entityos');
	var _ = require('lodash')
	var moment = require('moment');
	var entityosProtect = require('entityos/entityos.protect.js');

	entityos._util.message(event)

	if (event.isBase64Encoded)
	{
		event.body = Buffer.from(event.body, 'base64').toString('utf-8');
	}

	console.log(event)

	if (_.isString(event.body))
	{
		if (_.startsWith(event.body, 'ey'))
		{
			event.body = JSON.parse(Buffer.from(event.body, 'base64').toString('utf-8'));
		}
		else
		{
			event.body = JSON.parse(event.body);
		}
	}

	if (_.isString(event.body.data))
	{
		if (_.startsWith(event.body.data, 'ey'))
		{
			event.body.data = JSON.parse(Buffer.from(event.body, 'base64').toString('utf-8'));
		}
		else
		{
			event.body.data = JSON.parse(event.body.data);
		}
	}

	if (_.has(event, 'body._context'))
	{
		event.context = event.body._context;
	}

	entityos.set(
	{
		scope: '_event',
		value: event
	});

	entityos.set(
	{
		scope: '_context',
		value: context
	});

	/*
		Use promise to responded to API Gateway once all the processing has been completed.
	*/

	const promise = new Promise(function(resolve, reject)
	{	
		entityos.init(main);

		function main(err, data)
		{
			/*
				app initialises with entityos.invoke('app-init') after controllers added.
			*/

			/*var onchainfactory = require('onchainfactory/onchainfactory.process.js');

			if (_.has(onchainfactory, 'init'))
			{
				onchainfactory.init();
			}*/

			entityos.add(
			{
				name: 'app-init',
				code: function ()
				{
					entityos._util.message('Using entityos module version ' + entityos.VERSION);
					entityos._util.message(entityos.data.session);

					var eventData = entityos.get(
					{
						scope: '_event'
					});

					var request =
					{ 
						body: {},
						queryString: {},
						headers: {}
					}

					//back it also work with direct data input ie called as function.

					if (eventData != undefined)
					{
						request.queryString = eventData.queryStringParameters;
						request.headers = eventData.headers;

						if (_.isString(eventData.body))
						{
							request.body = JSON.parse(eventData.body)
						}
						else
						{
							request.body = eventData.body;
						}	
					}

					if (request.headers['x-api-key'] != undefined)
					{
						var _xAPIKey = _.split(request.headers['x-api-key'], '|');
						
						if (_xAPIKey.length == 0)
						{
							entityos.invoke('util-end', {error: 'Bad x-api-key in header [' + request.headers['x-api-key'] + '] - it should be {apiKey} or {apiKey}|{authKey}.'}, '401');
						}
						else
						{
							if (_xAPIKey.length == 1)
							{
								request.body.apikey = _xAPIKey[0];
							}
							else
							{
								request.body.apikey = _xAPIKey[0];
								request.body.authkey = _xAPIKey[1];
							}
						}
					}

					if (request.headers['x-auth-key'] != undefined)
					{
						request.body.authkey = request.headers['x-auth-key'];
					}

					entityos.set(
					{
						scope: '_request',
						value: request
					});

					entityos.set(
					{
						scope: '_data',
						value: request.body.data
					});

					if (request.body.apikey != undefined)
					{
						if (request.body.authkey != undefined)
						{
							entityos.invoke('app-auth');
						}
						else
						{
							if 	(	
									request.body.method == 'verify-user-auth'
									|| request.body.method == 'get-protocol-parameters'
								)
							{
								entityos.invoke('app-start');
							}
							else
							{
								entityos.invoke('util-end', {error: 'Missing authKey'}, '401');
							}
						}
					}
					else
					{
						entityos.invoke('app-start');
					}
				}
			});

			entityos.add(
			{
				name: 'app-auth',
				code: function (param)
				{
					var request = entityos.get(
					{
						scope: '_request'
					});

					var requestApiKeyGUID = request.body.apikey;

					entityos.cloud.search(
					{
						object: 'setup_user',
						fields: [{name: 'username'}],
						filters:
						[
							{
								field: 'guid',
								comparison: 'EQUAL_TO',
								value: requestApiKeyGUID
							}
						],
						callback: 'app-auth-process'
					});
				}
			});

			entityos.add(
			{
				name: 'app-auth-process',
				code: function (param, response)
				{
					entityos.set(
					{
						scope: 'app',
						context: 'user',
						value: response
					});

					if (response.status == 'ER')
					{
						entityos.invoke('util-end', {error: 'Error processing user authentication.'}, '401');
					}
					else
					{
						if (response.data.rows.length == 0)
						{
							var request = entityos.get(
							{
								scope: '_request'
							});

							var requestApiKeyGUID = request.body.apikey;

							entityos.invoke('util-end', {error: 'Bad apikey [' + requestApiKeyGUID + ']'}, '401');
						}
						else
						{
							var user = _.first(response.data.rows);

							var request = entityos.get(
							{
								scope: '_request'
							});

							var requestAuthKeyGUID = request.body.authkey;

							entityos.logon('app-auth-logon-process',
							{
								logon: user.username,
								password: requestAuthKeyGUID
							});
						}
					}
				}
			});

			entityos.add(
			{
				name: 'app-auth-logon-process',
				code: function (response)
				{
					if (response.status == 'ER')
					{
						entityos.invoke('util-end', {error: 'Bad authkey [' + requestAuthKeyGUID + ']'}, '401');
					}
					else
					{
						entityos.set(
						{
							scope: 'app',
							context: 'user',
							value: response
						});

						entityos.invoke('app-user');
					}
				}
			});

			entityos.add(
			{
				name: 'app-user',
				code: function (param)
				{
					entityos.cloud.invoke(
					{
						method: 'core_get_user_details',
						callback: 'app-user-process'
					});
				}
			});

			entityos.add(
			{
				name: 'app-user-process',
				code: function (param, response)
				{
					entityos.set(
					{
						scope: 'app',
						context: 'user',
						value: response
					})

					entityos.invoke('app-start')
				}
			});

			entityos.add(
			{
				name: 'util-uuid',
				code: function (param)
				{
					var pattern = entityos._util.param.get(param, 'pattern', {"default": 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'}).value;
					var scope = entityos._util.param.get(param, 'scope').value;
					var context = entityos._util.param.get(param, 'context').value;

					var uuid = pattern.replace(/[xy]/g, function(c) {
						    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
						    return v.toString(16);
						  });

					entityos.set(
					{
						scope: scope,
						context: context,
						value: uuid
					})
				}
			});

			entityos.add(
			{
				name: 'app-log',
				code: function ()
				{
					var eventData = entityos.get(
					{
						scope: '_event'
					});

					entityos.cloud.invoke(
					{
						object: 'core_debug_log',
						fields:
						{
							data: JSON.stringify(eventData),
							notes: 'app Log (Event)'
						}
					});

					var requestData = entityos.get(
					{
						scope: 'app',
						context: 'request'
					});

					entityos.cloud.invoke(
					{
						object: 'core_debug_log',
						fields:
						{
							data: JSON.stringify(requestData),
							notes: 'app Log (Request)'
						}
					});

					var contextData = entityos.get(
					{
						scope: '_context'
					});

					entityos.cloud.invoke(
					{
						object: 'core_debug_log',
						fields:
						{
							data: JSON.stringify(contextData),
							notes: 'appLog (Context)'
						},
						callback: 'app-log-saved'
					});
				}
			});

			entityos.add(
			{
				name: 'app-log-saved',
				code: function (param, response)
				{
					entityos._util.message('Log data saved to entityos.cloud');
					entityos._util.message(param);
					entityos._util.message(response);
				
					entityos.invoke('app-respond')
				}
			});

			entityos.add(
			{
				name: 'app-respond',
				code: function (param)
				{
					var response = entityos.get(
					{
						scope: 'app',
						context: 'response'
					});

					var statusCode = response.httpStatus;
					if (statusCode == undefined) {statusCode = '200'}

					var body = response.data;
					if (body == undefined) {body = {}}
					
					var headers = response.headers;
					if (headers == undefined) {headers = {}}

					let httpResponse =
					{
						statusCode: statusCode,
						headers: headers,
						body: JSON.stringify(body)
					};

					resolve(httpResponse)
				}
			});

			entityos.add(
			{
				name: 'util-end',
				code: function (data, statusCode, headers)
				{
					if (statusCode == undefined) { statusCode = '200' }
					if (headers == undefined) { headers = {'Content-Type': 'application/json'} }

					entityos.set(
					{
						scope: 'app',
						context: 'response',
						value:
						{
							data: data,
							statusCode: statusCode,
							headers: headers
						}
					});

					entityos.invoke('app-respond')
				}
			});

			entityos.add(
			{
				name: 'app-start',
				code: function ()
				{
					var request = entityos.get(
					{
						scope: '_request'
					});

					var data = request.body;
					var mode = data.mode;
					var method = data.method;

					if (_.isString(mode))
					{
						mode = {type: mode, status: 'OK'}
					}

					if (mode == undefined)
					{
						mode = {type: 'live', status: 'OK'}
					}

					if (mode.status == undefined)
					{
						mode.status = 'OK';
					}

					mode.status = mode.status.toUpperCase();

					if (mode.type == 'reflect')
					{
						var response = {}

						if (mode.data != undefined)
						{
							response.data = mode.data;
						}
						
						entityos.invoke('util-uuid',
						{
							scope: 'guid',
							context: 'log'
						});

						entityos.invoke('util-uuid',
						{
							scope: 'guid',
							context: 'audit'
						});

						response.data = _.assign(response.data,
						{
							status: mode.status,
							method: method,
							reflected: data,
							guids: entityos.get(
							{
								scope: 'guid'
							})
						});

						entityos.set(
						{
							scope: 'app',
							context: 'response',
							value: response
						});

						entityos.invoke('app-respond');
					}
					else
					{
						entityos.invoke('app-process');
					}
				}
			});

			//-- METHODS

			entityos.add(
			{
				name: 'app-process',
				code: function ()
				{
					var request = entityos.get(
					{
						scope: '_request'
					});

					var data = request.body;
					if (data.method == 'generate-address') {data.method = 'generate-wallet'}

					var method = data.method;
	
					if (_.includes(
					[
						'generate-mnemonic',
						'generate-hash',
						'verify-signed-data',
						'generate-wallet',
						'generate-account',
						'verify-user-auth',
						'init-keys',
						'generate-transaction',
						'verify-signed-data-policy',
						'get-protocol-parameters'
					],
						method))
					{
						entityos.invoke('app-process-' + method)
					}
					else
					{
						entityos.set(
						{
							scope: 'app',
							context: 'response',
							value:
							{
								status: 'ER',
								data: {error: {code: '2', description: 'Not a valid method [' + method + ']'}}
							}
						});

						entityos.invoke('app-respond');
					}
				}
			});

			entityos.add(
			{
				name: 'app-process-generate-mnemonic',
				code: function ()
				{
					var request = entityos.get(
					{
						scope: '_request'
					});

					var data = request.body.data;

					if (data == undefined)
					{
						entityos.invoke('util-end', 
						{
							error: 'Missing data.'
						},
						'403');
					}
					else
					{
						var bip39 = require('bip39');

						var wordsToStrength =
						{
							12: 128,
							15: 160,
							18: 192,
							21: 224,
							24: 256
						};

						if (data.words != undefined)
						{
							data.strength = wordsToStrength[data.words]
						}

						if (data.strength == undefined)
						{
							data.strength = 256;
						}

						var mnemonic = bip39.generateMnemonic(data.strength);
						var entropy = bip39.mnemonicToEntropy(mnemonic);

						var responseData =
						{
							"mnemonic": mnemonic,
							"entropy": entropy
						}

						entityos.invoke('util-end',
						{
							method: 'generate-mnemonic',
							status: 'OK',
							data: responseData
						},
						'200');
					}
				}
			});

			entityos.add(
			{
				name: 'app-process-generate-hash',
				code: function ()
				{
					var request = entityos.get(
					{
						scope: '_request'
					});

					var data = request.body.data;

					if (data == undefined)
					{
						data = {}
					}

					var blake2b = require('blake2b');

					if (_.isPlainObject(data.text))
					{
						data.text = JSON.stringify(data.text)
					}

					if (data.bytes == undefined)
					{
						if (data.hashlength == undefined)
						{
							data.hashlength = 256
							data.bytes = 32
						}
						else
						{
							data.bytes = data.hashlength / 8
						}
					}

					if (data.hashlength == undefined)
					{
						data.hashlength = data.bytes * 8;
					}

					var output = new Uint8Array(data.bytes);
					
					const hash = blake2b(output.length);
						hash.update(Buffer.from(data.text));
						hash.digest(output);

					data.hashedtexthex = Buffer.from(output).toString('hex');

					entityos.invoke('util-end',
					{
						method: 'generate-hash',
						status: 'OK',
						data: data
					},
					'200');				
				}
			});

			entityos.add(
			{
				name: 'app-process-verify-signed-data',
				code: function (data)
				{
					var request = entityos.get({scope: '_request'});
					var verify = request.body.data.verify;

					const verifyDataSignature = require('@cardano-foundation/cardano-verify-datasignature');

					const dataVerified = verifyDataSignature(
							verify.signature,
							verify.key,
							verify.datatoverify,
							verify.stakeaddress
					);

					if (dataVerified && request.body.data.verify.policy != undefined)
					{
						entityos.invoke('app-process-verify-signed-data-policy', data)
					}
					else
					{
						entityos.invoke('util-end', {dataverified: dataVerified})
					}
				}
			});

			entityos.add(
			{
				name: 'app-process-verify-signed-data-policy',
				code: function (data)
				{
					entityos.set(
					{
						scope: 'util-get-address-assets',
						value: {assets: [], page: 1}
					});

					entityos.invoke('app-process-verify-signed-data-policy-get-assets');
				}
			});

			entityos.add(
			{
				name: 'app-process-verify-signed-data-policy-get-assets',
				code: function (data)
				{
					var request = entityos.get({scope: '_request'});
					var settings = entityos.get({scope: '_settings'});
					var verify = request.body.data.verify;
					
					var data = entityos.get(
					{
						scope: 'util-get-address-assets'
					});

					//{assets: [], page: 1}
	
					const { BlockFrostAPI } = require('@blockfrost/blockfrost-js');

					const projectID = settings.onchain.cardano.blockfrost.projectId;
					
					if (projectID == undefined)
					{
						entityos.invoke('util-end',
						{
							error: 'No access to onchain data / indexing service. [indexer-service-api-key-not-set]'
						},
						'400');
					}
					else
					{
						const api = new BlockFrostAPI(
						{
							projectId: projectID,
						});

						const stakeAddress = verify.stakeaddress;
		
						api.accountsAddressesAssets(stakeAddress, {page: data.page}).then(function (_assets)
						{
							data.assets = data.assets.concat(_assets);
							data.page = (data.page + 1)
							const moreAssets = (_assets.length == 100);
							
							entityos.set(
							{
								scope: 'util-get-address-assets',
								value: data
							});

							if (moreAssets)
							{
								entityos.invoke('app-process-verify-signed-data-policy-get-assets');
							}
							else
							{
								entityos.invoke('app-process-verify-signed-data-policy-process');
							}

						})
						.catch(function (error)
						{
							console.log(error)
							entityos.invoke('util-end', {error: error.message})
						});
					}
				}
			});

			entityos.add(
			{
				name: 'app-process-verify-signed-data-policy-process',
				code: function (data)
				{
					var request = entityos.get({scope: '_request'});
					var verify = request.body.data.verify;

					var data = entityos.get(
					{
						scope: 'util-get-address-assets'
					});

					const policyIDs = _.split(verify.policy, ',');

					const filteredAssets = _.filter(data.assets, function (asset)
					{
						return !_.isUndefined(_.find(policyIDs, function (policyID) {return asset.unit.startsWith(policyID)}))
					});

					const policyVerified = (filteredAssets.length > 0);
					
					if (request.body.data.method = 'verify-user-auth')
					{
						entityos.invoke('app-process-verify-user-auth-respond',
						{
							status: (policyVerified?'OK':'ER'),
							dataverified: true,
							policyverified: policyVerified
						});
					}
					else
					{
						entityos.invoke('util-end',
						{
							status: (policyVerified?'OK':'ER'),
							dataverified: true,
							policyverified: policyVerified
						});
					}
				}
			});

			entityos.add(
			{
				name: 'app-process-verify-user-auth',
				code: function (param, response)
				{
					let request = entityos.get({scope: '_request'});
					let data = request.body.data;
					if (data == undefined) {data = {}}

					const requestApiKeyGUID = request.body.apikey;

					if (response == undefined)
					{
						if (requestApiKeyGUID == undefined)
						{
							entityos.invoke('util-end', {error: 'No apikey'}, '400');
						}
						else
						{
							entityos.cloud.search(
							{
								object: 'setup_user',
								fields: [{name: 'username'}],
								filters:
								[
									{
										field: 'guid',
										comparison: 'EQUAL_TO',
										value: requestApiKeyGUID
									}
								],
								callback: 'app-process-verify-user-auth'
							});
						}
					}
					else
					{
						if (response.data.rows.length == 0)
						{
							entityos.invoke('util-end', {error: 'Bad apikey [' + requestApiKeyGUID + ']'}, '401');
						}
						else
						{
							let event = entityos.get({scope: '_event'});
							event.user = _.first(response.data.rows);
							entityos.set({scope: '_event', value: event});

							entityos.invoke('app-process-verify-user-auth-identifiers');
						}
					}
				}
			});

			entityos.add(
			{
				name: 'app-process-verify-user-auth-identifiers',
				code: function (param, response)
				{
					let request = entityos.get({scope: '_request'});
					let event = entityos.get({scope: '_event'});

					if (response == undefined)
					{
						if (event.user == undefined)
						{
							entityos.invoke('util-end', {error: 'No user'}, '400');
						}
						else
						{
							entityos.cloud.search(
							{
								object: 'core_protect_key',
								fields: [{name: 'key'}, {name: 'category'}],
								filters:
								[
									{	
										field: 'object',
										comparison: 'EQUAL_TO',
										value: 22
									},
									{	
										field: 'objectcontext',
										comparison: 'EQUAL_TO',
										value: event.user.id
									},
									{	
										field: 'type',
										comparison: 'EQUAL_TO',
										value: 1
									},
									{	
										field: 'category',
										comparison: 'IN_LIST',
										value: '4,6,7,8,9,10'
									}
								],
								callback: 'app-process-verify-user-auth-identifiers'
							});
						}
					}
					else
					{
						if (response.data.rows.length == 0)
						{
							entityos.invoke('util-end', {error: 'No user identifiers'}, '401');
						}
						else
						{
							let event = entityos.get({scope: '_event'});
							event.user._identifiers = response.data.rows;
							entityos.set({scope: '_event', value: event});

							let request = entityos.get({scope: '_request'});
							let data = request.body.data;
							if (data == undefined) {data = {}}

							const policyUserIdentifiers = _.map(_.filter(event.user._identifiers, function (identifier)
							{
								//10 PolicyID | https://docs.entityos.cloud/CORE_PROTECT_KEY_SEARCH
								return (identifier.category == 10)
							}), 'key');

							console.log(policyUserIdentifiers);

							if (policyUserIdentifiers.length == 0)
							{
								entityos.invoke('util-end', {error: 'No user On-Chain Policy identifiers'}, '401');
							}

							data.verify = data.auth;
							data.verify.policy = _.join(policyUserIdentifiers, ',');

							if (request.headers['auth-logonkey'] != undefined
								&& request.headers['auth-logonkey'] != '')
							{
								data.verify.datatoverify = _.replace(data.verify.datatoverify, '[[LOGONKEY]]', request.headers['auth-logonkey']);
								data.verify.datatoverify = _.replace(data.verify.datatoverify, '[[logonkey]]', request.headers['auth-logonkey']);
							}

							entityos.set({scope: '_request', value: request});

							entityos.invoke('app-process-verify-signed-data-policy');
						}
					}
				}
			});

			entityos.add(
			{
				name: 'app-process-verify-user-auth-respond',
				code: function (param)
				{
					const event = entityos.get({scope: '_event'});
					const request = entityos.get({scope: '_request'});

					param.logon = event.user.username;
					param.siteguid = request.body.data.site; //'a210dba4-cd65-4a4f-a9e2-8432b2c01256';

					entityos.invoke('util-end', param)
				}
			});

			entityos.add(
			{
				name: 'app-process-generate-wallet',
				code: function ()
				{
					var request = entityos.get(
					{
						scope: '_request'
					});

					var data = request.body.data;

					if (data == undefined)
					{
						data = {}
					}
					
					var bip39 = require('bip39');
					var strength = 256; // 128 for 12 words, 256 for 24 words

					//See if in request data - else generate
					if (data.mnemonic == undefined)
					{
						data.mnemonic = bip39.generateMnemonic(strength);
					}

					if (data.entropy == undefined)
					{
						data.entropy = bip39.mnemonicToEntropy(data.mnemonic);
					}

					const Cardano = require("@emurgo/cardano-serialization-lib-nodejs");

					var _keys = {root: data.rootkey};

					/*
						ADD support for passphrase
						bip39.mnemonicToSeed(data.mnemonic, passphrase).then((seed) => {
							// Use the first 32 bytes of the seed for the root key
							let rootKey = Cardano.Bip32PrivateKey.from_bip39_entropy(
								seed.slice(0, 32),
								Buffer.from(''), // Derivation path can be passed here if needed
							);
					*/

					if (_keys.root == undefined)
					{
						if (data.passphrase != undefined)
						{
							//TODO: Put this in util function that calls back to this function with the root set
							bip39.mnemonicToSeed(data.mnemonic, data.passphrase).then(function (seed)
							{
								const seedFirst32Bytes = new Uint8Array(seed.buffer, seed.byteOffset, 32);

								_keys.root = Cardano.Bip32PrivateKey.from_bip39_entropy(
									Buffer.from(seedFirst32Bytes),
									Buffer.from(''),
								);

								//entityos.invoke('app-process-generate-wallet-process', _keys);

							}).catch(function(err)
							{
								console.error("Error generating seed from mnemonic and passphrase:", err);
							});
						}
						else
						{
							_keys.root = Cardano.Bip32PrivateKey.from_bip39_entropy(
								Buffer.from(data.entropy, 'hex'),
								Buffer.from(''),
							);
						}
					}

					/*
						Check this:

						var _rootkeybech32 = _keys.root;

						if (_.startsWith(_rootkeybech32, 'bech32:'))
						{
							_rootkeybech32 = _.replace(_rootkeybech32, 'bech32:', '');
						}

						_keys.root = Cardano.Bip32PrivateKey.from_bech32(_rootkeybech32);
					*/

					_keys.account = _keys.root
						.derive(harden(1852)) // purpose
						.derive(harden(1815)) // coin type
						.derive(harden(0)); // account #0

					_keys.public = _keys.account
						.derive(0) // external
						.derive(0)
						.to_public();

					_keys.stake = _keys.account
						.derive(2) // chimeric
						.derive(0)
						.to_public();

					data.keys = {};
					data.keys.root = {bech32: _keys.root.to_bech32()};
					data.keys.account = {bech32: _keys.account.to_bech32()};
					data.keys.public = {bech32: _keys.public.to_bech32()};
					data.keys.stake = {bech32: _keys.stake.to_bech32()};

					var _addresses = {};
				
					_addresses.base = Cardano.BaseAddress.new(
						Cardano.NetworkInfo.mainnet().network_id(),
						Cardano.Credential.from_keyhash(_keys.public.to_raw_key().hash()),
						Cardano.Credential.from_keyhash(_keys.stake.to_raw_key().hash()),
					);

					_addresses.enterprise = Cardano.EnterpriseAddress.new(
						Cardano.NetworkInfo.mainnet().network_id(),
						Cardano.Credential.from_keyhash(_keys.public.to_raw_key().hash())
					);

					_addresses.pointer = Cardano.PointerAddress.new(
						Cardano.NetworkInfo.mainnet().network_id(),
						Cardano.Credential.from_keyhash(_keys.public.to_raw_key().hash()),
						Cardano.Pointer.new(
							100, // slot
							2,   // tx index in slot
							0    // cert indiex in tx
						)
					);

					_addresses.stake = Cardano.RewardAddress.new(
						Cardano.NetworkInfo.mainnet().network_id(),
						Cardano.Credential.from_keyhash(_keys.stake.to_raw_key().hash())
					);

					data.addresses = {};

					data.addresses = 
					{
						base: {bech32: _addresses.base.to_address().to_bech32()},
						enterprise: {bech32: _addresses.enterprise.to_address().to_bech32()},
						pointer: {bech32: _addresses.pointer.to_address().to_bech32()},
						stake: {bech32: _addresses.stake.to_address().to_bech32()}
					}

					var responseData =
					{
						"mnemonic": data.mnemonic,
						"entropy": data.entropy,
						"keys": data.keys,
						"addresses": data.addresses 
					}

					console.log(responseData)

					if (request.body.method == 'generate-wallet')
					{
						entityos.invoke('util-end',
						{
							method: 'generate-wallet',
							status: 'OK',
							data: responseData
						},
						'200');
					}
					else
					{
						//STORE AS PRIVATE PROTECT_KEY AGAINST USER
						entityos.invoke('app-process-generate-account-process')
					}
				}
			});

			entityos.add(
			{
				name: 'app-process-generate-account',
				code: function ()
				{
					entityos.invoke('app-process-generate-wallet');
				}
			});

			entityos.add(
			{
				name: 'app-process-generate-account-process',
				code: function ()
				{
					entityos.invoke('app-process-generate-account-process-conversation')
				}
			});

			entityos.add(
			{
				name: 'app-process-generate-account-process-conversation',
				code: function ()
				{
					//Verify that the user making the API request has the authority to create the account
					//Do this via messaging_conversation
					//Requestor has to be the owner of the conversation that the post "Create account" relates to.
					//Octo is a participant
					//AuthKey == Conversation Post GUID

					//request.userkey - for account.
					//request.conversationkey or request.conversationpostkey

					var request = entityos.get(
					{
						scope: '_request'
					});

					var data = request.body.data;

					if (data == undefined)
					{
						data = {}
					}

					const keys = 
					{
						user: data.userkey,
						conversation: data.conversationkey
					}

					if (keys.user == undefined || keys.conversation == undefined)
					{
						entityos.invoke('util-end', {error: 'Missing User &/or Conversation/Post Key'}, '401');
					}
					else
					{
						//This will prove both keys.
						//Have to do double pass as no subsearch to owner user GUID.

						entityos.cloud.search(
						{
							object: 'messaging_conversation',
							fields: [{name: 'owner'}],
							filters:
							[
								{
									field: 'guid',
									comparison: 'EQUAL_TO',
									value: keys.conversation
								},
								{
									field: 'sharing',
									comparison: 'EQUAL_TO',
									value: 1
								}
							],
							callback: 'app-process-generate-account-process-conversation-response'
						});
					}
				}
			});

			entityos.add(
			{
				name: 'app-process-generate-account-process-conversation-response',
				code: function (param, response)
				{
					var request = entityos.get(
					{
						scope: '_request'
					});

					var data = request.body.data;

					const keys = 
					{
						user: data.userkey,
						conversation: data.conversationkey
					}

					if (response.data.rows.length == 0)
					{
						entityos.invoke('util-end', {error: 'Bad Conversation Key'}, '401');
					}
					else
					{
						const conversation = _.first(response.data.rows);

						entityos.cloud.search(
						{
							object: 'setup_user',
							fields: [{name: 'createddate'}],
							filters:
							[
								{
									field: 'guid',
									comparison: 'EQUAL_TO',
									value: keys.user
								},
								{
									field: 'id',
									comparison: 'EQUAL_TO',
									value: conversation.owner
								}
							],
							callback: 'app-process-generate-account-process-user-response'
						});
					}
				}
			});

			entityos.add(
			{
				name: 'app-process-generate-account-process-user-response',
				code: function (param, response)
				{
					//Verify that the user making the API request has the authority to create the account
					//Do this via messaging_conversation
					//Requestor has to be the owner of the conversation that the post "Create account" relates to.
					//Octo is a participant
					//AuthKey == Conversation Post GUID

					//request.userkey - for account.
					//request.conversationpostkey

					var request = entityos.get({scope: '_request'});
					var data = request.body.data;

					if (response.data.rows.length == 0)
					{
						entityos.invoke('util-end', {error: 'Bad User Key (Not The Conversation Owner)'}, '401');
					}
					else
					{
						let event = entityos.get({scope: '_event'});
						event._user = _.first(response.data.rows);
						entityos.set({scope: '_event', value: event});
						entityos.invoke('app-process-generate-account-process-save')
					}
				}
			});

			entityos.add(
			{
				name: 'app-process-generate-account-process-save',
				code: function (param, response)
				{
					const request = entityos.get({scope: '_request'});
					const data = request.body.data;
					const event = entityos.get({scope: '_event'});

					// Category: 4 (Identity)
					// Type: 2 (Private)

					if (response == undefined)
					{
						entityos.cloud.search(
						{
							object: 'core_protect_key',
							fields: [{name: 'key'}, {name: 'notes'}, {name: 'guid'}],
							filters:
							[
								{
									field: 'object',
									comparison: 'EQUAL_TO',
									value: 22
								},
								{
									field: 'objectcontext',
									comparison: 'EQUAL_TO',
									value: event._user.id
								},
								{
									field: 'category',
									comparison: 'EQUAL_TO',
									value: 4
								},
								{
									field: 'type',
									comparison: 'EQUAL_TO',
									value: 2
								},
								{
									field: 'private',
									comparison: 'EQUAL_TO',
									value: 'Y'
								},
								{
									field: 'title',
									comparison: 'EQUAL_TO',
									value: '[onchain-cardano-account-fully-managed]'
								}
							],
							callback: 'app-process-generate-account-process-save'
						});
					}
					else
					{
						let keyID;
						let keyNotes;

						if (response.data.rows != 0)
						{
							keyID = _.first(response.data.rows).id;
							keyNotes = _.first(response.data.rows).notes;
						}

						const cloudSave = (keyID == undefined || (keyID != undefined && data.reset == true)); 

						if (!cloudSave)
						{
							let keyAddresses;

							if (keyNotes != '')
							{
								const _keyNotes = _.split(keyNotes, '|');
								keyAddresses =
								{
									addresses:
									{
										stake: {bech32: _.first(_keyNotes)},
										base: {bech32: _.last(_keyNotes)}
									}
								}
							}

							entityos.invoke('util-end',
							{	
								data: keyAddresses,
								warning: 'On-Chain account already exists - use reset:true to reset it.'
							}, '200');
						}
						else
						{
							//AES encrypt the mnemonic|passphrase using Octo settings

							let keyInfo = data.mnemonic;
							if (data.passphrase != undefined)
							{
								keyInfo += '|' + data.passphrase
							}

							const settings = entityos.get({scope: '_settings'});

							const key = _.get(settings, 'protect.key');
							const iv = _.get(settings, 'protect.iv');

							// Key IV Stored Against this Octo API User.
							const encrypted = entityosProtect.encrypt(
							{
								text: keyInfo,
								key: key,
								iv: iv
							});

							const notes = _.get(data, 'addresses.stake.bech32') + '|' + _.get(data, 'addresses.base.bech32');

							// id: keyID, -- removed so keeps old keys for now - so don't lose access to seed phrase etc

							entityos.cloud.save(
							{
								object: 'core_protect_key',
								data:
								{
									category: 4, //identity
									key: encrypted.textEncrypted, //seed phrase & optional passphrase - encypted
									object: 22,
									objectcontext: event._user.id,
									type: 2,
									private: 'Y', // To Octo (API) has custody
									title: '[onchain-cardano-account-fully-managed]',
									notes: notes,
									datareturn: 'guid'
								},
								callback: 'app-process-generate-account-process-finalise'
							});
						}
					}
				}
			});

			entityos.add(
			{
				name: 'app-process-generate-account-process-finalise',
				code: function (param, response)
				{
					console.log(response);

					let guid;

					if (_.get(response, 'data.rows', 0) != 0)
					{
						guid = _.first(response.data.rows).guid;
					}

					var request = entityos.get(
					{
						scope: '_request'
					});

					var data = request.body.data;

					var responseData =
					{
						"addresses": data.addresses,
						"key": guid
					}
					
					entityos.invoke('util-end',
					{
						method: 'generate-account',
						status: 'OK',
						data: responseData
					},
					'200');
				}
			});

			// -- GENERATE TRANSACTION

			entityos.add(
			{
				name: 'app-process-generate-transaction',
				code: function (param, response)
				{
					// check the userkey/conversation is valid
					// Get user protect_key as Octo (user in settings.json) title='[onchain-cardano-account-fully-managed]'
					// Decrypt
					// Use menmonic to create keys for signing etc

					entityos.invoke('util-octo-user-conversation-check',
					{
						onComplete: 'app-process-generate-transaction-process'
					});
				}
			});

			entityos.add(
			{
				name: 'app-process-generate-transaction-process',
				code: function (param, response)
				{
					// Is it Octo or User Signing the Transaction?
					// useOctoKeys

					// OctoKeys on ENV else get from core_protect_key

					// !!! If use OctoKeys then need check if legitimate, else user needs to sign and submit.

					let data = entityos.get({scope: '_data'});
					let event = entityos.get({scope: '_event'});

					console.log(event._user)

					if (data.octoSign)
					{
						const signPublicKeyHex = _.get(settings, 'protect.sign.publicKeyHex');
						const signPrivateKeyHex = _.get(settings, 'protect.sign.privateKeyHex');

						//console.log(signPublicKeyHex)
						//console.log(signPrivateKeyHex)

						if (signPrivateKeyHex == undefined || signPublicKeyHex == undefined)
						{}
						else	
						{
							curveKeys =
							{
								public: {hex: signPublicKeyHex},
								private: {hex: signPrivateKeyHex}
							}
						}

						entityos.set(
						{
							scope: 'generate-transaction',
							context: 'curveKeys',
							value: curveKeys

						});
					}
					else
					{
						//app.invoke('app-process-generate-transaction-process-user-keys')
					}

				}
			});

			entityos.add(
			{
				name: 'app-process-generate-transaction-process-user-keys',
				code: function (param, response)
				{
					//
					let request = entityos.get({scope: '_request'});
					let data = _.get(request, 'body.data');
					let event = entityos.get({scope: '_event'});

					if (response == undefined)
					{
						if (!_.isPlainObject(event._user))
						{
							entityos.invoke('util-end', {error: 'Missing User Data'}, '400');
						}
						else
						{
							entityos.cloud.search(
							{
								object: 'core_protect_key',
								fields: [{name: 'key'}],
								filters:
								[
									{
										field: 'object',
										comparison: 'EQUAL_TO',
										value: 22
									},
									{
										field: 'objectcontext',
										comparison: 'EQUAL_TO',
										value: event._user.id
									},
									{
										field: 'category',
										comparison: 'EQUAL_TO',
										value: 4
									},
									{
										field: 'type',
										comparison: 'EQUAL_TO',
										value: 2
									},
									{
										field: 'private',
										comparison: 'EQUAL_TO',
										value: 'Y'
									},
									{
										field: 'title',
										comparison: 'EQUAL_TO',
										value: '[onchain-cardano-account-fully-managed]'
									}
								],
								callback: 'app-process-generate-transaction-process-key'
							});
						}
					}
					else
					{
						if (response.data.rows.length == 0)
						{
							entityos.invoke('util-end', {error: 'No managed on-chain account. You need to generate an account using generate-account.'}, '401');
						}
						else
						{
							let event = entityos.get({scope: '_event'});
							event._account = _.first(response.data.rows);

							const settings = entityos.get({scope: '_settings'});

							const key = _.get(settings, 'protect.key');
							const iv = _.get(settings, 'protect.iv');

							// Key IV Stored Against this Octo API User.
							const decrypted = entityosProtect.decrypt(
							{
								text: event._account.key,
								key: key,
								iv: iv
							});

							const keyInfo = decrypted.textDecrypted;
							const _keyInfo = _.split(keyInfo); //mnemonic|passphrase
							const mnemonic = _.first(_keyInfo);

							const bip39 = require('bip39');
							const entropy = bip39.mnemonicToEntropy(mnemonic);

							//Generate Private Keys for the Account to send transaction.
							//This can be octo say sending OCTO token to an account.
			
							const Cardano = require("@emurgo/cardano-serialization-lib-nodejs");

							let _keys = {};

							_keys.root = Cardano.Bip32PrivateKey.from_bip39_entropy(
								Buffer.from(entropy, 'hex'),
								Buffer.from(''),
							);
					
							_keys.account = _keys.root
								.derive(harden(1852)) // purpose
								.derive(harden(1815)) // coin type
								.derive(harden(0)); // account #0

							// Create transaction - say using lucid - can just do it from the mnemomic
							// Get from index.js to converge the files - ie make index.js support the API.

							// !! Call 'onchain-process-transaction' from onchainfactory.process.js

							entityos.invoke('util-end', event);
						}
					}
				}
			});

			entityos.add(
			{
				name: 'app-process-init-keys',
				code: function (param)
				{
					// Use in console to get some keys
					const encrypted = entityosProtect.encrypt(
					{
						text: 'not-important-as-just-getting-keys'
					});

					entityos.invoke('util-end', encrypted);
				}
			});

			entityos.add(
			{
				name: 'app-process-get-protocol-parameters',
				code: function (data)
				{
					var request = entityos.get({scope: '_request'});
					var settings = entityos.get({scope: '_settings'});
					var verify = request.body.data.verify;
					
					var data = entityos.get(
					{
						scope: 'get-protocol-parameters'
					});

					//{assets: [], page: 1}
	
					const { BlockFrostAPI } = require('@blockfrost/blockfrost-js');

					const projectID = settings.onchain.cardano.blockfrost.projectId;
					
					if (projectID == undefined)
					{
						entityos.invoke('util-end',
						{
							error: 'No access to onchain data / indexing service. [indexer-service-api-key-not-set]'
						},
						'400');
					}
					else
					{
						const api = new BlockFrostAPI(
						{
							projectId: projectID,
						});

						//console.log(api)

						api.epochsLatestParameters().then(function (parameters)
						{
							//data.parameters = parameters;

							console.log(JSON.stringify(parameters))
							
							const responseData =
							{
								"parameters": parameters
							}
							
							entityos.invoke('util-end',
							{
								method: 'get-protocol-parameters',
								status: 'OK',
								data: responseData
							},
							'200');

						})
						.catch(function (error)
						{
							console.log(error)
							entityos.invoke('util-end', {error: error.message})
						});
					}
				}
			});

			// UTIL

			entityos.add(
			{
				name: 'util-octo-user-conversation-check',
				code: function (param)
				{
					//Verify that the user making the API request has the authority to make the request
					//Do this via messaging_conversation
					//Requestor has to be the owner of the conversation that the post "Create account" relates to.
					//Octo has to be a participant
					//AuthKey == Conversation or Convesation Post GUID

					//request.userkey - for account.
					//request.conversationkey or request.conversationpostkey

					var request = entityos.get(
					{
						scope: '_request'
					});

					var data = request.body.data;

					if (data == undefined)
					{
						data = {}
					}

					const keys = 
					{
						user: data.userkey,
						conversation: data.conversationkey
					}

					if (keys.user == undefined || keys.conversation == undefined)
					{
						entityos.invoke('util-end', {error: 'Missing User and/or Conversation/Post Key'}, '401');
					}
					else
					{
						//Have to do double pass as no subsearch to owner user GUID.

						entityos.cloud.search(
						{
							object: 'messaging_conversation',
							fields: [{name: 'owner'}],
							filters:
							[
								{
									field: 'guid',
									comparison: 'EQUAL_TO',
									value: keys.conversation
								},
								{
									field: 'sharing',
									comparison: 'EQUAL_TO',
									value: 1
								}
							],
							callback: 'util-octo-user-conversation-check-response',
							callbackParam: param
						});
					}
				}
			});

			entityos.add(
			{
				name: 'util-octo-user-conversation-check-response',
				code: function (param, response)
				{
					var request = entityos.get(
					{
						scope: '_request'
					});

					var data = request.body.data;

					const keys = 
					{
						user: data.userkey,
						conversation: data.conversationkey
					}

					if (response.data.rows.length == 0)
					{
						entityos.invoke('util-end', {error: 'Bad Conversation Key'}, '401');
					}
					else
					{
						const conversation = _.first(response.data.rows);

						entityos.cloud.search(
						{
							object: 'setup_user',
							fields: [{name: 'createddate'}],
							filters:
							[
								{
									field: 'guid',
									comparison: 'EQUAL_TO',
									value: keys.user
								},
								{
									field: 'id',
									comparison: 'EQUAL_TO',
									value: conversation.owner
								}
							],
							callback: 'util-octo-user-conversation-check-user-response',
							callbackParam: param
						});
					}
				}
			});

			entityos.add(
			{
				name: 'util-octo-user-conversation-check-user-response',
				code: function (param, response)
				{
					var request = entityos.get({scope: '_request'});
				
					if (response.data.rows.length == 0)
					{
						entityos.invoke('util-end', {error: 'Bad User Key (Not The Conversation Owner)'}, '401');
					}
					else
					{
						let event = entityos.get({scope: '_event'});
						event._user = _.first(response.data.rows);
						entityos.set({scope: '_event', value: event});
						entityos._util.onComplete(param)
					}
				}
			});

			// !!!! APP STARTS HERE; Initialise the app; app-init invokes app-start if authentication OK
			entityos.invoke('app-init');
		}	

		function harden(num)
		{
			return 0x80000000 + num;
		}	
   });

  	return promise
}