// HMI Adapter
// Provide low level logic and control of house
// eg. toggle buttons and loads

// const MongoClient = require('mongodb').MongoClient;
// const assert = require('assert');

/*

to support 

topic,payload -> action
phidget/0/di/9/state 1

allow multiple actions for one event

*/

const recipesFile = "./recipes.json"

const mqtt = require('mqtt')

var recipes = []
var subscriptions = []

// array of mqtt topics to track states for toggles
// we will not reload these unless from a cache
var states = [] 

const loadRecipes = function() {
	
	console.log("Loading recipes from " + recipesFile)
	recipes = require(recipesFile);
	
	for (var recipe of recipes) {
		console.log("Configuring Recipe: " + recipe.name)
		// event
		// if type==mqtt-standard; assumed
		console.log(" - event: " + recipe.event.mqtt_topic + " -> " + recipe.event.mqtt_payload)
		subscriptions.push(recipe.event.mqtt_topic)
		
		for (var action of recipe.actions) {
			// assume mqtt toggle
			console.log(" - action: " + action.mqtt_topic_set + " -> toggle")
			subscriptions.push(action.mqtt_topic_state)
		}

		// actions
		
	}

}
loadRecipes()

const mqttc = mqtt.connect('mqtt://localhost')
mqttc.on('connect', function () {
	console.log("Connected to mqtt broker")

	for (var subscription of subscriptions) {
		// console.log("subscribing to topic: " + subscription)
		mqttc.subscribe(subscription)
	}
	// client.publish('presence', 'Hello mqtt')
})

mqttc.on('error', function (error) {
	console.log("mqtt error:",error)
})

mqttc.on('reconnect', function () {
	console.log("mqttc reconnect")
})

mqttc.on('message', function (topic, message) {

	// find associated recipe event/action_state for topic
	for (var recipe of recipes) {
		// check if topic matches recipe event
		if (topic == recipe.event.mqtt_topic) {
			// MESSAGE IS AN EVENT
			if (message == recipe.event.mqtt_payload) {
				// MATCHED AN EVENT - PROCEED TO ACTIONS
				console.log("Event \"" + topic + "\" matches recipe: " + recipe.name)
				for (var action of recipe.actions) {
					// TODO - assuming we are a toggle
					msg = ""
					if (states[action.mqtt_topic_state]=="ON") msg = "OFF"
					if (states[action.mqtt_topic_state]=="OFF") msg = "ON"

					console.log(" - action: " + action.mqtt_topic_set + " -> " + msg)
					mqttc.publish(action.mqtt_topic_set, msg, { retain : false, qos : 1 })
				}
			} // else console.log("ignoring message; payload did not match event payload")
		} else { // if topic==event
			for (var action of recipe.actions) {
				if (topic == action.mqtt_topic_state) {
					// MESSAGE IS A TOPIC STATE
					states[action.mqtt_topic_state] = message
				}
			}
		}
		
	}
	
	// find associated action state topic (state monitoring)

	
	
})

/* 

const resetTimeoutTimer = function () {
	// reset the timeout timer
	if (!mqttReceiving) {
		console.log("receiving data!")
	} mqttReceiving = true
	clearTimeout(mqttReceiveTimeoutTimer)
	mqttReceiveTimeoutTimer = setTimeout(mqttReceiveTimeout, 5 * 1000)
}



var sendAlert = function(topic, message, urgency = 0) {
    
	var msg = {
		message: message, // required
		title: topic,
		// sound: '',
		// device: 'devicename',
		
        // By default, messages have normal priority (a priority of 0). 
        // -2 Lowest (no sound, vibration, or popup)
        // -1 Low (no sound or vibration)
        //  0 Normal
        //  1 High (bypasses quiet hours)
        //  2 Emergency (repeats, requires ack) retry and expire parameters must be supplied
		priority: urgency
	}
	
	// urgency 2 requires additional parameters
	if (urgency == 2) {
	    msg["expire"] = 10800
	    msg["retry"] = 30
	    msg["sound"] = "alien"
	}
	
	// iterate through list of user tokens
	pushoverUserTokens.forEach(function(userToken) {
	
		var p = new Push( {
			user: userToken,
			token: pushoverAppToken,
		})

		p.send( msg, function( err, result ) {
			if ( err ) {
				throw err
			}
			console.log("pushover api result = " + result)
		})
		
	});
		
}

*/