/*

MQTT Event Controller

2019 Matthew Currie VE7MJC

React to low level events via MQTT messages

eg. switches, buttons, and inputs controlling loads without the use of a 
higher level automation controller

*/

const recipesFile = "./recipes.json"

const assert = require('assert');
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
					if (states[action.mqtt_topic_state]=="1") msg = "0"
					if (states[action.mqtt_topic_state]=="0") msg = "1"

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


})
