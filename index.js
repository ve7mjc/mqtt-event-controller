/*

MQTT Event Controller

2019 Matthew Currie VE7MJC

React to low level events via MQTT messages

eg. switches, buttons, and inputs controlling loads without the use of a 
higher level automation controller

*/

const recipesFile = "./recipes.json"

const assert = require('assert')
const mqtt = require('mqtt')

// SystemD Notify
// https://www.npmjs.com/package/sd-notify
const notify = require('sd-notify')

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
			// do not proceed if there is no state to subscribe to
			if ("mqtt_topic_state" in action) {
			    console.log(" - action: " + action.mqtt_topic_set + " -> toggle")
			    subscriptions.push(action.mqtt_topic_state)
		    }
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

	// we are ready
	notify.ready()
	notify.startWatchdogMode(2800)
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
		    
			// Does the payload of this message match our recipe filter?
			if (message == recipe.event.mqtt_payload) {
			    
				// MATCHED AN EVENT - PROCEED TO ACTIONS
				console.log("Event \"" + topic + "\" matches recipe: " + recipe.name)
				for (var action of recipe.actions) {
					
					// are we an MQTT ACTION?
					if ("mqtt_action" in action) {
					
					    if (action.mqtt_action == "toggle") {
					        
        					// run through known binary values if toggle values
        					// are not specified in the recipe
        					msg = ""
        					
        					// account for case mismatch and whitespace
        					filtered_topic = String(states[action.mqtt_topic_state]).toLowerCase().trim()
        					
        					switch (filtered_topic) {
        						case "on":
        							msg = "OFF"
        							break;
        						case "off":
        							msg = "ON"
        							break;
        						case "high":
        							msg = "LOW"
        							break;
        						case "low":
        							msg = "HIGH"
        							break;
        						case "1":
        							msg = "0"
        							break;
        						case "0":
        							msg = "1"
        							break;
        						default:

        					}

        					console.log(" - action: " + action.mqtt_topic_set + " -> " + msg)
        					mqttc.publish(action.mqtt_topic_set, msg, { retain : false, qos : 1 })
        					
        			    } // end of toggle
        			    
        			    if (action.mqtt_action =="oneshot") {
        			        msg = action.mqtt_payload
        			        console.log(" - action: " + action.mqtt_topic_set + " -> " + msg)
        			        mqttc.publish(action.mqtt_topic_set, msg, { retain : false, qos : 1 })
        			    }
        					
					}
					
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

}) // mqtt message

// handle SIGINT for graceful restarts with
// process management daemons such as pm2
process.on('SIGINT', function() {
	console.log("received SIGINT; exiting")
	process.exit()
});