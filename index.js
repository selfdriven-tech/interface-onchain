/*
	See:
	https://learn-next.entityos.cloud/learn-function-automation

	This is node app to automate tasks
	https://www.npmjs.com/package/lambda-local:

	prod:
	lambda-local -l index.js -t 9000 -e event-onchain-query.json
	lambda-local -l index.js -t 9000 -e event-onchain-query-with-address.json
	lambda-local -l index.js -t 9000 -e event-onchain-key-categories.json
	lambda-local -l index.js -t 9000 -e event-onchain-query-with-metadata-label.json
	lambda-local -l index.js -t 9000 -e event-onchain-query-assets-by-policy.json
	lambda-local -l index.js -t 9000 -e event-onchain-query-with-metadata-label-sda.json
	lambda-local -l index.js -t 9000 -e event-onchain-query-account.json
	lambda-local -l index.js -t 9000 -e event-onchain-query-account-assets.json
	lambda-local -l index.js -t 9000 -e event-onchain-query-assets.json

	lambda-local -l index.js -t 9000 -e event-onchain-transaction-create-skill-sources.json
	lambda-local -l index.js -t 9000 -e event-onchain-transaction-create-skill-domains.json
	lambda-local -l index.js -t 9000 -e event-onchain-transaction-create-skill-levels.json
	lambda-local -l index.js -t 9000 -e event-onchain-transaction-create-skill-capacities.json
	lambda-local -l index.js -t 9000 -e event-onchain-transaction-prepare-skills.json
	lambda-local -l index.js -t 9000 -e event-onchain-process-get-keys.json
	lambda-local -l index.js -t 9000 -e event-onchain-process-transaction.json
	lambda-local -l index.js -t 9000 -e event-onchain-process-oncloud-ssi-verifiable-credentials.json

	lab:
	lambda-local -l index.js -t 9000 -e event-onchain-process-oncloud-actions-lab.json // issue if actions are linked to teamonly project -- octo can't see them.
	lambda-local -l index.js -t 9000 -e event-onchain-process-oncloud-ssi-verifiable-credentials-lab.json

	lambda-local -l index.js -t 9000 -e event-onchain-process-transaction-lab.json
	lambda-local -l index.js -t 9000 -e event-onchain-process-transaction-from-octo-to-account-lab.json
	lambda-local -l index.js -t 9000 -e event-onchain-process-transaction-from-octo-to-script-lab.json
	lambda-local -l index.js -t 9000 -e event-onchain-process-transaction-from-account-to-octo-lab.json
	
	lambda-local -l index.js -t 9000 -e event-onchain-process-transaction-mint-lab.json
	lambda-local -l index.js -t 9000 -e event-onchain-process-transaction-hash-lab.json

	lambda-local -l index.js -t 9000 -e event-onchain-process-get-keys-lab.json
	lambda-local -l index.js -t 9000 -e event-onchain-process-get-keys-account-lab.json

	lambda-local -l index.js -t 9000 -e event-onchain-process-generate-script-address-lab.json
	lambda-local -l index.js -t 9000 -e event-onchain-process-get-script-address-utxos-lab.json

	lambda-local -l index.js -t 9000 -e event-onchain-process-generate-script-plutus-address-lab.json

	lambda-local -l index.js -t 9000 -e event-onchain-process-transaction-from-script-to-octo-lab.json
	lambda-local -l index.js -t 9000 -e event-onchain-process-transaction-witness-sign-lab.json
	lambda-local -l index.js -t 9000 -e event-onchain-process-transaction-from-script-to-octo-with-witnesses-lab.json

	lambda-local -l index.js -t 9000 -e event-onchain-process-transaction-from-octo-to-script-plutus-lab.json
	lambda-local -l index.js -t 9000 -e event-onchain-process-transaction-from-script-plutus-to-octo-lab.json

	Setup:
	See README.md

	Methods:
		onchain-query
		onchain-protect-key-categories
		onchain-query-addresses
		onchain-protect-key-identites
		onchain-protect-key-addresses
		util-verify-data

	zip -r ../selfdriven-onchain-DDMMMYYYY-n.zip *

	lab address:
	addr1q98ztnjfnwzyzakpcany4n60s76jy58k9hdde4sl68jyahexj04qy6cdqd5yktnvkytplxppw8a30tm0cu84kq8nymgssw53ld
*/

exports.handler = function (event, context, callback)
{
	var entityos = require('entityos')
	var _ = require('lodash');

	entityos.set(
	{
		scope: '_event',
		value: event
	});

	//Event: {"site": "0000"}

	entityos.set(
	{
		scope: '_context',
		value: context
	});

	entityos.set(
	{
		scope: '_callback',
		value: callback
	});

	var settings;

	if (event != undefined)
	{
		if (event.site != undefined)
		{
			settings = event.site;
			//ie use settings-[event.site].json
		}
		else
		{
			settings = event;
		}
	}

	/*entityos._util.message(
	[
		'-',
		'EVENT-SETTINGS:',
		settings
	]);*/

	entityos.init(main, settings);
	
	entityos._util.message('Using entityos module version ' + entityos.VERSION);
	
	function main(err, data)
	{
		var settings = entityos.get({scope: '_settings'});
		var event = entityos.get({scope: '_event'});

		/*entityos._util.message(
		[
			'-',
			'SETTINGS:',
			settings
		]);*/

		var namespace;
		
		if (_.has(settings, 'blockchain.namespace'))
		{
			namespace = settings.blockchain.namespace;
		}

		if (_.has(settings, 'onchain.namespace'))
		{
			namespace = settings.onchain.namespace;
		}
	
		if (event.namespace != undefined)
		{
			namespace = event.namespace;
		}

		if (namespace != undefined)
		{
			entityos._util.message(
			[
				'-',
				'NAMESPACE:',
				namespace
			]);

			var onchainfactory = require('onchainfactory/onchainfactory.' + namespace + '.js');
		}

		if (_.has(onchainfactory, 'init'))
		{
			onchainfactory.init();
		}

		entityos.add(
		{
			name: 'onchain-query',
			code: function ()
			{
				entityos.invoke('onchain-protect-key-categories');
			}
		});

		entityos.add(
		{
			name: 'onchain-protect-key-categories',
			code: function (param, response)
			{
				if (response == undefined)
				{
					entityos.cloud.search(
					{
						object: 'setup_core_protect_key_category',
						fields: [{name:'title'}],
						rows: 9999,
						callback: 'onchain-protect-key-categories',
						callbackParam: param
					});
				}
				else
				{
					var keyCategories = {}
					_.each(response.data.rows, function (row) {keyCategories[row.title] = row.id})

					entityos.set(
					{
						scope: 'onchain',
						context: 'protect-key-categories',
						value: keyCategories
					});

					entityos.invoke('onchain-query-addresses')
				}
			}
		});

		entityos.add(
		{
			name: 'onchain-query-addresses',
			code: function ()
			{
				var event = entityos.get({scope: '_event'});

				if (event.address != undefined)
				{
					entityos.set(
					{
						scope: '_event',
						context: 'addresses',
						value: [event.address]
					});

					entityos.invoke('onchain-protect-key-identites');
				}
				else
				{
					entityos.invoke('onchain-protect-key-addresses');
				}
			}
		});

		entityos.add(
		{
			name: 'onchain-protect-key-addresses',
			code: function (param, response)
			{
				var keyCategories = entityos.get(
				{
					scope: 'onchain',
					context: 'protect-key-categories'
				});

				if (response == undefined)
				{
					entityos.cloud.search(
					{
						object: 'core_protect_key',
						fields: [{ name: 'key' }],
						filters: 
						[
							{
								field: 'category',
								comparison: 'EQUAL_TO',
								value: keyCategories['Blockchain Address']
							}
						],
						rows: 9999,
						callback: 'onchain-protect-key-addresses'
					});
				}
				else
				{
					var addresses = entityos.set(
					{
						scope: '_event',
						context: 'addresses',
						value: _.map(response.data.rows, 'key')
					});

					console.log(addresses)
					entityos.invoke('onchain-protect-key-identites');
				}
			}
		});

		entityos.add(
		{
			name: 'onchain-protect-key-identites',
			code: function (param, response)
			{
				var keyCategories = entityos.get(
				{
					scope: 'onchain',
					context: 'protect-key-categories'
				});

				if (response == undefined)
				{
					entityos.cloud.search(
					{
						object: 'core_protect_key',
						fields: [{ name: 'key' }, { name: 'title'}],
						filters: 
						[
							{
								field: 'category',
								comparison: 'EQUAL_TO',
								value: keyCategories['Identity']
							}
						],
						rows: 9999,
						callback: 'onchain-protect-key-identites'
					});
				}
				else
				{
					var identites = entityos.set(
					{
						scope: 'onchain',
						context: 'identites',
						value: response.data.rows
					});

					var projectIndentity = _.find(identites, function (identity) {return identity.title == 'BlockFrost Project ID'});

					console.log(projectIndentity)

					if (projectIndentity != undefined)
					{
						entityos.set(
						{
							scope: '_event',
							context: 'blockfrostProjectId',
							value: projectIndentity.key
						});
					}

					entityos.invoke('onchain-query-process');
				}
			}
		});

		entityos.add(
		{
			name: 'onchain-query-process',
			code: function ()
			{
				var event = entityos.get({scope: '_event'});

				console.log(event)

				if (event.processComplete == undefined)
				{
					event.processComplete = 'onchain-query-complete'
				}

				// See /blockchainfactory
				entityos.invoke('onchain-blockfrost-query')
			}
		});

		entityos.add(
		{
			name: 'onchain-query-complete',
			code: function (data)
			{
				entityos.invoke('util-end', data)
			}
		});

		entityos.add(
		{
			name: 'util-verify-data',
			code: function (data)
			{
				var event = entityos.get({scope: '_event'});
				const verifyDataSignature = require('@cardano-foundation/cardano-verify-datasignature');

				//console.log(verifyDataSignature(signature, key));
				//console.log(verifyDataSignature(signature, key, message));
				var dataVerified = verifyDataSignature(
						event.verify.signature,
						event.verify.key,
						event.verify.dataToVerify,
						event.verify.stakeAddress
				);

				entityos.invoke('util-end', {dataVerified: dataVerified})
			}
		});
		
		entityos.add(
		{
			name: 'util-log',
			code: function (data)
			{
				entityos.cloud.save(
				{
					object: 'core_debug_log',
					data: data
				});
			}
		});

		entityos.add(
		{
			name: 'util-end',
			code: function (data, error)
			{
				var callback = entityos.get(
				{
					scope: '_callback'
				});

				if (error == undefined) {error = null}

				if (callback != undefined)
				{
					callback(error, data);
				}
			}
		});

		entityos.add(
		{
			name: 'util-get-from-file',
			code: function (param)
			{
				var filename = entityos._util.param.get(param, 'filename').value;

				if (filename == undefined)
				{
					console.log('No filename.')
				}
				else
				{
					var fs = require('fs');

					fs.readFile(filename, function (err, buffer)
					{
						if (!err)
						{	
							var fileData = buffer.toString();

							if (_.includes(filename, '.json'))
							{
								fileData = JSON.parse(fileData);
							}

							param = entityos._util.param.set(param, 'fileData', fileData);

							entityos._util.onComplete(param);
						}
						else
						{
							console.log('ERROR! Could not read the file: ' + event.filename)
						}
					});
				}
			}
		});

		entityos.add(
		{
			name: 'util-save-to-file',
			code: function (param, data)
			{
				var event = entityos.get({scope: '_event'});
				var filename = entityos._util.param.get(param, 'filename', {default: 'data.json'}).value;
				var scope = entityos._util.param.get(param, 'scope', {default: 'util-save-to-file'}).value;
				var fileData = entityos._util.param.get(param, 'fileData').value;
				var saveAsJSON = entityos._util.param.get(param, 'saveAsJSON', {default: true}).value;
				
				if (fileData == undefined)
				{
					fileData = entityos.get({scope: scope})
				}

				if (fileData != undefined)
				{
					const fs = require('fs');

					var fileDataSave = fileData;
					
					if (saveAsJSON)
					{
						try
						{
							fileDataSave = JSON.stringify(fileDataSave, null, 4);
						}
						catch (error) {}
					}

					try
					{
						fs.writeFileSync(filename, fileDataSave);
						entityos._util.onComplete(param);
					}
					catch (error)
					{
						console.error(error);
						entityos._util.onComplete(param);
					}
				}
			}
		});

		entityos.add(
		{
			name: 'util-text-to-hex',
			code: function (param)
			{
				var textUTF8 = entityos._util.param.get(param, 'text').value;

				const bufferText = Buffer.from(textUTF8, 'utf8');
				const textHex = bufferText.toString('hex');

				return textHex;
			}
		});

		entityos.add(
		{
			name: 'util-text-replace-all',
			code: function (param)
			{
				var text = entityos._util.param.get(param, 'text').value;
				var replaceText = entityos._util.param.get(param, 'replaceText').value;
				var withText = entityos._util.param.get(param, 'withText').value;

				var replacedTexted = text;

				if (text != undefined)
				{
					replacedTexted = text.replace(new RegExp(replaceText, 'g'), withText);
				}

				return replacedTexted;
			}
		});

		entityos.add(
		{
			name: 'util-as-object',
			code: function (param)
			{
				var reference = entityos._util.param.get(param, 'reference').value;
				var rootObject = entityos._util.param.get(param, 'rootObject').value;

				if (reference == undefined || reference == '')
				{
					referenceAsObject = undefined;
				}
				else
				{
					if (rootObject == undefined) {rootObject = {}}
					
					var referenceAsObject = rootObject;

					var _reference = (reference).split('.');

					_.each(_reference, function(ref)
					{
						referenceAsObject = referenceAsObject[ref];	
					});
						
				}	

				return referenceAsObject;
			}
		});

		/* STARTS HERE! */

		var event = entityos.get({scope: '_event'});

		var controller = event.controller;

		if (controller == undefined)
		{
			console.log('!! No controller [event.controller]')
		}
		else
		{
			entityos.invoke(controller);
		}
	}
}