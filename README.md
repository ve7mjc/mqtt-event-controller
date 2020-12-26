# MQTT Event Controller #
	
Execute actions based on MQTT message events and conditions

Individual "recipes" match MQTT messages (events) to one or more actions.

The goal is to reduce this functional logic to a low level to allow higher-level control systems (such as HASS.io) to focus on more complex tasks and ensure that basic functionality of a system is maintained during higher-level controller outtages.

## Typical Usage ## 

Control loads from switch toggles, button presses, and other inputs.

* Momentary light switch toggles light on and off with each successive press

## Future Goals ##

* Partition each recipe and related processing to decrease risk to application uptime
* Add scalar range values to events to enable control of output based on input range (eg temperature controlled fan, alarm)
