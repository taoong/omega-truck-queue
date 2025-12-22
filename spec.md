# Truck Queue App for Omega Products International

## Context
During regular work days, Omega Products International can expect to have roughly 40 trucks arrive at their facility in Corona, California. During peak hours (e.g. morning or lunchtime) there can be as many as 15 trucks arriving around the same time. 

The trucks first go to the staging zones in the facility (capacity of max 2 trucks) where the truck drivers hand over the paperwork to confirm their order.

Once validated, the trucks go to loading zones in the facility (capacity of max 3 trucks) to either make a delivery or pick up a shipment, and each loading/unloading operation takes 15-30 minutes including tie-down. 

When all 3 loading zones and 2 staging zones are occupied, other trucks that arrive have to wait outside the facility parked along the street.


### Problem
The city is changing the street design such that trucks will no longer be able to park outside the facility. This will come into effect in February 2026. This means that any overflow of trucks will have no way to queue up to access the facility.

### Solution
Build a mobile-friendly web application that can help manage the influx of trucks to the Omega facility. The complete app should be delivered by February 1, 2026.

There will be three separate interfaces for each type of user:
Truck drivers (mobile web)
Shipping admins (mobile/tablet web)
Order desk admins (desktop web)


## Proposal

### Features (for MVP)

#### Truck Drivers
Can check the number of trucks currently on the waitlist and the estimated waiting time
Can join the queue by inputting:
* Pickup or delivery
* PO number / confirmation code
* Phone number
Can see suggested places nearby the facility where they can park and wait
Can receive text notifications for:
* When they have successfully entered the queue with their PO number / confirmation code
* When they have been kicked off the queue due to inputting an invalid PO number / confirmation code or if they are too far from the facility
* When they are X minutes from the top of the queue
* When they left a certain radius from the facility and have X minutes to return to the facility’s vicinity or they will be deprioritized in the queue
* When they should proceed to the staging area within the next X minutes
* When they failed to arrive at the staging area within X minutes and have been moved to the back of the queue (unless the queue is empty)

#### Shipping Admins
Can create an account
Can view all trucks in the queue, along with their:
* Time that they entered the queue
* PO number / confirmation code
* Phone number
* Distance from the facility in time + miles using Google Maps API (if driver shares location)
* PO number validation status
Can summon trucks from the queue and assign them to one of the two staging zones
Can view and update the status of the two staging zones
* Green: available/empty
* Yellow: waiting for summoned trucker
* Red: occupied by trucker (verified by GPS)
Can edit the order of the queue and kick users off the queue (with an option to include why they were kicked off)
Can view the history of all tickets and interactions / notifications sent with timestamps

#### Order Desk Admins
Can create an account
Can view all trucks in the queue and their PO numbers
Can manually create a ticket in the app and add them to the queue
Can validate or invalidate PO numbers, which would send a notification to the respective truck driver
