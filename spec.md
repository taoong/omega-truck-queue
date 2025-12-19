# Truck Queue App for Omega Products International

## Context
During regular work days, Omega Products International can expect to have roughly 40 trucks arrive at their facility in Corona, California. During peak hours (e.g. lunchtime) there can be as many as 15 trucks arriving around the same time. 

These trucks go to loading zones in the facility (capacity of max 3 trucks) to either make a delivery or pick up a shipment, and each loading/unloading operation takes roughly 15 minutes. Before going to the loading zones, there are staging zones in the facility (capacity of max 2 trucks) where the trucks can hand over the paperwork to confirm their order and wait for a loading zone to be available. When all 3 loading zones and 2 staging zones are occupied, other trucks that arrive have to wait outside the facility parked along the street.

### Problem
The city is changing the street design such that trucks will no longer be able to park outside the facility. This will come into effect in February 2026. This means that outside of the 5 designated zones within the facility, any overflow of trucks will have no way to queue up for staging.

### Solution
Omega would like to build an app that manages the influx of trucks to their facility. 

## Proposal

### The queue system
Note that the queue isn't just a list; it’s a State Machine.

Pending: Driver submitted info, waiting for Admin approval.
Queued: Approved, waiting for a spot.
Summoned: Top of the list, told to head to the facility.
Staging: Currently in the 2-truck staging zone.
Loading: In one of the 3 loading bays.
Completed/Expired: Left the facility or kicked for inactivity.

### Two separate apps
Admins will use a web interface that requires them to login using their given admin accounts.
Users will use a mobile interface where they are not required to log in.

### Features (for MVP)
Users = truck drivers
Admins = Omega operators

Users can check the number of trucks on the waitlist and the estimated waiting time
Users can input a PO number + confirmation code upon arrival (verified by sharing their location and calling some sort of maps API that checks if the truck is within a 10 minute drive from the facility)
Users can see an image of off-location places within the 10 minute radius where they can park and wait
Users can receive notifications for, and see a history of logs showing:
- When they have successfully entered the queue
- When they failed to enter the queue due to either an invalid PO number / confirmation code, or if they are too far from the facility
- When they are X minutes from the top of the queue
- When they left a certain radius from the facility and have X minutes to return to the facility’s vicinity
- When they left a certain radius from the facility for too long and have been kicked from the queue
- When they are at the top of the queue and should proceed to the staging area within the next X minutes
- When they failed to arrive at the staging area within X minutes and have been moved to the back of the queue (unless the queue is empty)

Admins can view all users attempting to join the queue and they can accept or reject (with a reason of either invalid info or their location being too far). Rejection would have to go through a verification popup in case it was clicked on by accident.
Admins can view the history of all tickets and interactions / notifications sent with timestamps
Admins can edit the order of the queue (via drag+drop interactions) and kick users off the queue (with a popup dialog to confirm)

### Additional Features (for future versions)
Users can create accounts
Users and Admins can message each other
Admins can see a live map view of all trucks in the waitlist
