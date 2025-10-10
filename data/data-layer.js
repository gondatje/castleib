(function(global){
  'use strict';

  /**
   * Castle Hot Springs data layer
   * ---------------------------------
   * - RAW_ACTIVITIES_DATA and RAW_SPA_DATA below are the single source of truth for builder data.
   * - UI code should call CHSDataLayer.getActivitiesForSeasonDay(...) for visible rows and
   *   CHSDataLayer.getActivityMetadata(...) for hidden metadata.
   * - Spa helpers (listSpaCategories, getSpaServicesByCategory, etc.) provide future access to enriched spa data.
   * - This file replaces the legacy JSON files: data/activities.json, data/spa.json, data/locations.json.
   */

  const RAW_ACTIVITIES_DATA = {
"October 16Th Through November 19Th": {
"Monday": [
{
"title": "Castle Peak Via Ferrata Climb",
"start": "8:00am",
"end": "11:00am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "8:15am",
"end": "10:30am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Overlook Hike",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Guided Archery",
"start": "11:30am",
"end": "12:15pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "11:30am",
"end": "12:45pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Axe Throwing",
"start": "12:30pm",
"end": "1:15pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "1:00pm",
"end": "4:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "2:00pm",
"end": "2:45pm",
"location": "Watsu Pond",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Mindfulness Activity - Rock Mandalas",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Wine Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
}
],
"Tuesday": [
{
"title": "Castle Peak Via Ferrata Climb",
"start": "8:00am",
"end": "11:00am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "8:15am",
"end": "10:30am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Canyon Walk",
"start": "10:30am",
"end": "11:45am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Guided Archery",
"start": "11:30am",
"end": "12:15pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Mindfulness Activity - Cholla Suncatchers",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Agave Spirits Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "3:30pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
}
],
"Wednesday": [
{
"title": "Castle Peak Via Ferrata Climb",
"start": "8:00am",
"end": "11:00am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "8:15am",
"end": "10:30am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Discovery Loop Hike",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Guided Archery",
"start": "11:30am",
"end": "12:15pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "11:30am",
"end": "12:45pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Axe Throwing",
"start": "12:30pm",
"end": "1:15pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "1:00pm",
"end": "4:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "2:00pm",
"end": "2:45pm",
"location": "Watsu Pond",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Mindfulness Activity - Body Scrubs",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
}
],
"Thursday": [
{
"title": "Castle Peak Via Ferrata Climb",
"start": "8:00am",
"end": "11:00am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "8:15am",
"end": "10:30am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Canyon Walk",
"start": "10:30am",
"end": "11:45am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Guided Archery",
"start": "11:30am",
"end": "12:15pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Mindfulness Activity - Rock Mandalas",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Agave Spirits Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "3:30pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
}
],
"Friday": [
{
"title": "Castle Peak Via Ferrata Climb",
"start": "8:00am",
"end": "11:00am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "8:15am",
"end": "10:30am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Overlook Hike",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Guided Archery",
"start": "11:30am",
"end": "12:15pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "11:30am",
"end": "12:45pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Axe Throwing",
"start": "12:30pm",
"end": "1:15pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "1:00pm",
"end": "4:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "2:00pm",
"end": "2:45pm",
"location": "Watsu Pond",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Mindfulness Activity - Cactus Candles",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
}
],
"Saturday": [
{
"title": "Castle Peak Via Ferrata Climb",
"start": "8:00am",
"end": "11:00am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "8:15am",
"end": "10:30am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Discovery Loop Hike",
"start": "10:30am",
"end": "11:45am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Guided Archery",
"start": "11:30am",
"end": "12:15pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Axe Throwing",
"start": "12:30pm",
"end": "1:15pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "1:00pm",
"end": "4:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Mindfulness Activity - Body Scrubs",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Wine Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "3:30pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
}
],
"Sunday": [
{
"title": "Castle Peak Via Ferrata Climb",
"start": "8:00am",
"end": "11:00am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "8:15am",
"end": "10:30am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Canyon Walk",
"start": "10:30am",
"end": "11:45am",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Guided Archery",
"start": "11:30am",
"end": "12:15pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Mindfulness Activity - Sunprint Postcards",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "3:30pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 10.16 - 11.19 Fall.pdf"
}
]
}
,
"April 23Rd Through July 5Th": {
"Monday": [
{
"title": "Overlook Hike",
"start": "6:45am",
"end": "8:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "7:00am",
"end": "9:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "9:00am",
"end": "10:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Guided Archery",
"start": "10:00am",
"end": "10:45am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Farm Tour",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Axe Throwing",
"start": "11:00am",
"end": "11:45am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Mindfulness Activity - Rock Mandalas",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Wine Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
}
],
"Tuesday": [
{
"title": "Canyon Walk",
"start": "7:00am",
"end": "8:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "7:00am",
"end": "9:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "7:30am",
"end": "9:00am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Guided Archery",
"start": "10:00am",
"end": "10:45am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "10:30am",
"end": "11:15am",
"location": "Watsu Pond",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Farm Tour",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Mindfulness Activity - Cholla Suncatchers",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Agave Spirits Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
}
],
"Wednesday": [
{
"title": "Discovery Loop Hike",
"start": "6:45am",
"end": "8:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "7:00am",
"end": "9:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "9:00am",
"end": "10:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Guided Archery",
"start": "10:00am",
"end": "10:45am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Farm Tour",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Axe Throwing",
"start": "11:00am",
"end": "11:45am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Mindfulness Activity - Body Scrubs",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
}
],
"Thursday": [
{
"title": "Canyon Walk",
"start": "7:00am",
"end": "8:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "7:00am",
"end": "9:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "7:30am",
"end": "9:00am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Guided Archery",
"start": "10:00am",
"end": "10:45am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "10:30am",
"end": "11:15am",
"location": "Watsu Pond",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Farm Tour",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Mindfulness Activity - Rock Mandalas",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Agave Spirits Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
}
],
"Friday": [
{
"title": "Overlook Hike",
"start": "6:45am",
"end": "8:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "7:00am",
"end": "9:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "9:00am",
"end": "10:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Guided Archery",
"start": "10:00am",
"end": "10:45am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Farm Tour",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Axe Throwing",
"start": "11:00am",
"end": "11:45am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Mindfulness Activity - Cactus Candles",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
}
],
"Saturday": [
{
"title": "Discovery Loop Hike",
"start": "6:45am",
"end": "8:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "7:00am",
"end": "9:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Guided Archery",
"start": "10:00am",
"end": "10:45am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Farm Tour",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Axe Throwing",
"start": "11:00am",
"end": "11:45am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Mindfulness Activity - Body Scrubs",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Wine Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
}
],
"Sunday": [
{
"title": "Canyon Walk",
"start": "7:00am",
"end": "8:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "7:00am",
"end": "9:15am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "7:30am",
"end": "9:00am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Guided Archery",
"start": "10:00am",
"end": "10:45am",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "10:30am",
"end": "11:15am",
"location": "Watsu Pond",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Mindfulness Activity - Sunprint Postcards",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2026 - 04.23 - 07.05 Spring Summer.pdf"
}
]
}
,
"August 28Th Through October 15Th": {
"Monday": [
{
"title": "Overlook Hike",
"start": "6:45am",
"end": "8:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "7:00am",
"end": "9:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "9:00am",
"end": "10:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Guided Archery",
"start": "10:00am",
"end": "10:45am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Farm Tour",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Axe Throwing",
"start": "11:00am",
"end": "11:45am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Mindfulness Activity - Rock Mandalas",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Cooling Aroma Restorative Yoga",
"start": "2:00pm",
"end": "3:00pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Wine Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Yoga Nidra",
"start": "4:30pm",
"end": "5:00pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
}
],
"Tuesday": [
{
"title": "Canyon Walk",
"start": "7:00am",
"end": "8:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "7:00am",
"end": "9:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "7:30am",
"end": "9:00am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Guided Archery",
"start": "10:00am",
"end": "10:45am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "10:30am",
"end": "11:15am",
"location": "Watsu Pond",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Farm Tour",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Mindfulness Activity - Cholla Suncatchers",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Agave Spirits Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
}
],
"Wednesday": [
{
"title": "Discovery Loop Hike",
"start": "6:45am",
"end": "8:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "7:00am",
"end": "9:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "9:00am",
"end": "10:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Guided Archery",
"start": "10:00am",
"end": "10:45am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Farm Tour",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Axe Throwing",
"start": "11:00am",
"end": "11:45am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Mindfulness Activity - Body Scrubs",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Core Yoga",
"start": "2:00pm",
"end": "3:00pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Intro to Mantra",
"start": "4:30pm",
"end": "5:00pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
}
],
"Thursday": [
{
"title": "Canyon Walk",
"start": "7:00am",
"end": "8:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "7:00am",
"end": "9:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "7:30am",
"end": "9:00am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Guided Archery",
"start": "10:00am",
"end": "10:45am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "10:30am",
"end": "11:15am",
"location": "Watsu Pond",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Farm Tour",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Mindfulness Activity - Rock Mandalas",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Cooling Aroma Restorative Yoga",
"start": "2:00pm",
"end": "3:00pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Agave Spirits Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Yoga Nidra",
"start": "3:15pm",
"end": "3:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
}
],
"Friday": [
{
"title": "Overlook Hike",
"start": "6:45am",
"end": "8:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "7:00am",
"end": "9:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "9:00am",
"end": "10:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Guided Archery",
"start": "10:00am",
"end": "10:45am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Farm Tour",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Axe Throwing",
"start": "11:00am",
"end": "11:45am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Mindfulness Activity - Cactus Candles",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Core Yoga",
"start": "2:00pm",
"end": "3:00pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Intro to Mantra",
"start": "4:30pm",
"end": "5:00pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
}
],
"Saturday": [
{
"title": "Discovery Loop Hike",
"start": "6:45am",
"end": "8:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "7:00am",
"end": "9:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Guided Archery",
"start": "10:00am",
"end": "10:45am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Farm Tour",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Axe Throwing",
"start": "11:00am",
"end": "11:45am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Mindfulness Activity - Body Scrubs",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Cooling Aroma Restorative Yoga",
"start": "2:00pm",
"end": "3:00pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Wine Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Yoga Nidra",
"start": "3:15pm",
"end": "3:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
}
],
"Sunday": [
{
"title": "Canyon Walk",
"start": "7:00am",
"end": "8:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "7:00am",
"end": "9:15am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "7:00am",
"end": "10:00am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "7:30am",
"end": "9:00am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Guided Archery",
"start": "10:00am",
"end": "10:45am",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "10:30am",
"end": "11:15am",
"location": "Watsu Pond",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Mindfulness Activity - Sunprint Postcards",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025 - 08.28 - 10.15 Late Summer.pdf"
}
]
}
,
"March 5Th Through April 22Nd": {
"Monday": [
{
"title": "Castle Peak Via Ferrata Climb",
"start": "8:00am",
"end": "11:00am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "8:15am",
"end": "10:30am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Overlook Hike",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Guided Archery",
"start": "11:30am",
"end": "12:15pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "11:30am",
"end": "12:45pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Axe Throwing",
"start": "12:30pm",
"end": "1:15pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "1:00pm",
"end": "4:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "2:00pm",
"end": "2:45pm",
"location": "Watsu Pond",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Mindfulness Activity - Rock Mandalas",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Wine Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
}
],
"Tuesday": [
{
"title": "Castle Peak Via Ferrata Climb",
"start": "8:00am",
"end": "11:00am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "8:15am",
"end": "10:30am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Canyon Walk",
"start": "10:30am",
"end": "11:45am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Guided Archery",
"start": "11:30am",
"end": "12:15pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Mindfulness Activity - Cholla Suncatchers",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Agave Spirits Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "3:30pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
}
],
"Wednesday": [
{
"title": "Castle Peak Via Ferrata Climb",
"start": "8:00am",
"end": "11:00am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "8:15am",
"end": "10:30am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Discovery Loop Hike",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Guided Archery",
"start": "11:30am",
"end": "12:15pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "11:30am",
"end": "12:45pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Axe Throwing",
"start": "12:30pm",
"end": "1:15pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "1:00pm",
"end": "4:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "2:00pm",
"end": "2:45pm",
"location": "Watsu Pond",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Mindfulness Activity - Body Scrubs",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
}
],
"Thursday": [
{
"title": "Castle Peak Via Ferrata Climb",
"start": "8:00am",
"end": "11:00am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "8:15am",
"end": "10:30am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Canyon Walk",
"start": "10:30am",
"end": "11:45am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Guided Archery",
"start": "11:30am",
"end": "12:15pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Mindfulness Activity - Rock Mandalas",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Agave Spirits Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "3:30pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
}
],
"Friday": [
{
"title": "Castle Peak Via Ferrata Climb",
"start": "8:00am",
"end": "11:00am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "8:15am",
"end": "10:30am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Overlook Hike",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Guided Archery",
"start": "11:30am",
"end": "12:15pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "11:30am",
"end": "12:45pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Axe Throwing",
"start": "12:30pm",
"end": "1:15pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "1:00pm",
"end": "4:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "2:00pm",
"end": "2:45pm",
"location": "Watsu Pond",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Mindfulness Activity - Cactus Candles",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
}
],
"Saturday": [
{
"title": "Castle Peak Via Ferrata Climb",
"start": "8:00am",
"end": "11:00am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "8:15am",
"end": "10:30am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Discovery Loop Hike",
"start": "10:30am",
"end": "11:45am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Paddle Board Yoga",
"start": "11:00am",
"end": "12:00pm",
"location": "Lower Springs",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Guided Archery",
"start": "11:30am",
"end": "12:15pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Axe Throwing",
"start": "12:30pm",
"end": "1:15pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "1:00pm",
"end": "4:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Mindfulness Activity - Body Scrubs",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Wine Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "3:30pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
}
],
"Sunday": [
{
"title": "Castle Peak Via Ferrata Climb",
"start": "8:00am",
"end": "11:00am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "8:15am",
"end": "10:30am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Canyon Walk",
"start": "10:30am",
"end": "11:45am",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Guided Archery",
"start": "11:30am",
"end": "12:15pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Mindfulness Activity - Sunprint Postcards",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "3:30pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2026 - 03.05 - 04.22 Spring.pdf"
}
]
}
,
"November 20Th Through March 4Th": {
"Monday": [
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "9:00am",
"end": "12:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "9:15am",
"end": "11:30am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Overlook Hike",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Guided Archery",
"start": "12:00pm",
"end": "12:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "12:30pm",
"end": "1:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Axe Throwing",
"start": "1:00pm",
"end": "1:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "1:00pm",
"end": "4:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "2:00pm",
"end": "2:45pm",
"location": "Watsu Pond",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Mindfulness Activity - Rock Mandalas",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Wine Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
}
],
"Tuesday": [
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "9:00am",
"end": "12:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "9:15am",
"end": "11:30am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Canyon Walk",
"start": "10:30am",
"end": "11:45am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Guided Archery",
"start": "12:00pm",
"end": "12:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Mindfulness Activity - Cholla Suncatchers",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Agave Spirits Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "3:00pm",
"end": "4:30pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
}
],
"Wednesday": [
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "9:00am",
"end": "12:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "9:15am",
"end": "11:30am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Discovery Loop Hike",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Guided Archery",
"start": "12:00pm",
"end": "12:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "12:30pm",
"end": "1:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Axe Throwing",
"start": "1:00pm",
"end": "1:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "1:00pm",
"end": "4:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "2:00pm",
"end": "2:45pm",
"location": "Watsu Pond",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Mindfulness Activity - Body Scrubs",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
}
],
"Thursday": [
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "9:00am",
"end": "12:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "9:15am",
"end": "11:30am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Canyon Walk",
"start": "10:30am",
"end": "11:45am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Guided Archery",
"start": "12:00pm",
"end": "12:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Mindfulness Activity - Rock Mandalas",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Agave Spirits Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "3:00pm",
"end": "4:30pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
}
],
"Friday": [
{
"title": "Rise & Shine Flow Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "9:00am",
"end": "12:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "9:15am",
"end": "11:30am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Landscape Restoration and Development Tour",
"start": "9:30am",
"end": "10:15am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Intro to Tai Chi",
"start": "10:15am",
"end": "11:00am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Overlook Hike",
"start": "10:30am",
"end": "11:30am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Guided Archery",
"start": "12:00pm",
"end": "12:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Sound Bath",
"start": "12:30pm",
"end": "1:30pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "E-Biking 101: Intro to E-Bike Tour",
"start": "12:30pm",
"end": "1:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Axe Throwing",
"start": "1:00pm",
"end": "1:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "1:00pm",
"end": "4:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Healing Waters Qigong",
"start": "2:00pm",
"end": "2:45pm",
"location": "Watsu Pond",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Mindfulness Activity - Cactus Candles",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Yoga",
"start": "3:15pm",
"end": "4:10pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
}
],
"Saturday": [
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "9:00am",
"end": "12:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "9:15am",
"end": "11:30am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Discovery Loop Hike",
"start": "10:30am",
"end": "11:45am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Guided Archery",
"start": "12:00pm",
"end": "12:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Axe Throwing",
"start": "1:00pm",
"end": "1:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Crater Canyon Exploration",
"start": "1:00pm",
"end": "4:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Mindfulness Activity - Body Scrubs",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Wine Tasting",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "3:00pm",
"end": "4:30pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Connecting With Water",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
}
],
"Sunday": [
{
"title": "Yoga",
"start": "8:30am",
"end": "9:25am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Castle Peak Via Ferrata Climb",
"start": "9:00am",
"end": "12:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Scenic Desert E-Bike Ride",
"start": "9:15am",
"end": "11:30am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Meditation",
"start": "9:40am",
"end": "10:00am",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Canyon Walk",
"start": "10:30am",
"end": "11:45am",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Guided Archery",
"start": "12:00pm",
"end": "12:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "History Tour",
"start": "2:00pm",
"end": "2:45pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Mindfulness Activity - Sunprint Postcards",
"start": "2:00pm",
"end": "2:45pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Farm to Bar: Mixology 101",
"start": "3:00pm",
"end": "4:00pm",
"location": "Murphy Hall",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Sonoran Aerial Walkway",
"start": "3:00pm",
"end": "4:30pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Castle Hot Springs Documentary Viewing",
"start": "4:00pm",
"end": "4:45pm",
"location": "Stone House",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
},
{
"title": "Farm Tour",
"start": "4:00pm",
"end": "5:00pm",
"location": "Lodge",
"source": "2025-2026 - 11.20 - 03.04 Winter.pdf"
}
]
}
};

  const RAW_SPA_DATA = {
"services": [
{
"category": "Massages",
"name": "Castle Hot Springs Custom Massage",
"durations_minutes": [
60,
90,
120
],
"subcategory": null,
"supports_in_room": false
},
{
"category": "Massages",
"name": "CBD Massage",
"durations_minutes": [
90,
120
],
"subcategory": null,
"supports_in_room": false
},
{
"category": "Massages",
"name": "Aroma-Wellness Massage",
"durations_minutes": [
60,
90
],
"subcategory": null,
"supports_in_room": true
},
{
"category": "Massages",
"name": "Motherhood Massage",
"durations_minutes": [
60,
90
],
"subcategory": null,
"supports_in_room": true
},
{
"category": "Massages",
"name": "Adventure Ready Massage",
"durations_minutes": [
60,
90
],
"subcategory": null,
"supports_in_room": false
},
{
"category": "Facials",
"name": "Castle Custom Facial",
"durations_minutes": [
60,
90
],
"subcategory": null,
"supports_in_room": true
},
{
"category": "Facials",
"name": "Men's Castle Custom Facial",
"durations_minutes": [
60,
90
],
"subcategory": null,
"supports_in_room": null
},
{
"category": "Treatments",
"name": "Sonoran Desert Transformation",
"durations_minutes": [
120
],
"subcategory": "Full Body",
"supports_in_room": false
},
{
"category": "Treatments",
"name": "Mineral Scrub & Full Body Massage",
"durations_minutes": [
90,
120
],
"subcategory": "Full Body",
"supports_in_room": false
},
{
"category": "Treatments",
"name": "Lavender Lemongrass Journey",
"durations_minutes": [
120
],
"subcategory": "Full Body",
"supports_in_room": false
},
{
"category": "Treatments",
"name": "Prickly Pear & Shea Butter Wrap",
"durations_minutes": [
60
],
"subcategory": "Full Body",
"supports_in_room": false
},
{
"category": "Therapies",
"name": "Watsu",
"durations_minutes": [
60,
90
],
"subcategory": "Water Therapy",
"supports_in_room": false
},
{
"category": "Therapies",
"name": "Aquatic Energy Balancing",
"durations_minutes": [
60,
90
],
"subcategory": "Water Therapy",
"supports_in_room": false
},
{
"category": "Therapies",
"name": "Table Thai Yoga Therapy",
"durations_minutes": [
60,
90
],
"subcategory": "Energy Therapy",
"supports_in_room": false
},
{
"category": "Therapies",
"name": "Cranial Sacral Therapy",
"durations_minutes": [
60,
90
],
"subcategory": "Energy Therapy",
"supports_in_room": true
},
{
"category": "Therapies",
"name": "Reiki",
"durations_minutes": [
60,
90
],
"subcategory": "Energy Therapy",
"supports_in_room": true
},
{
"category": "Therapies",
"name": "Cranial Sacral/Reiki Combo",
"durations_minutes": [
90
],
"subcategory": "Energy Therapy",
"supports_in_room": true
},
{
"category": "Intentional Wellness",
"name": "Meditation",
"durations_minutes": [
60
],
"subcategory": "Mindful Mindscapes",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Seated 8 Brocades",
"durations_minutes": [
60
],
"subcategory": "Mindful Mindscapes",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Spiritual Mantra",
"durations_minutes": [
60
],
"subcategory": "Mindful Mindscapes",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Yoga Nidra",
"durations_minutes": [
60
],
"subcategory": "Mindful Mindscapes",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Zen Soaking Secrets",
"durations_minutes": [
60
],
"subcategory": "Mindful Mindscapes",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Chakra Tune-Up",
"durations_minutes": [
60
],
"subcategory": "Energy Alignments",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Private Sound Bath",
"durations_minutes": [
60
],
"subcategory": "Energy Alignments",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Five Spirit Animal Protection",
"durations_minutes": [
60
],
"subcategory": "Energy Alignments",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Breathwork",
"durations_minutes": [
60
],
"subcategory": "Energy Alignments",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Custom Yoga",
"durations_minutes": [
60
],
"subcategory": "Longevity Arts",
"supports_in_room": true
},
{
"category": "Intentional Wellness",
"name": "Vinyasa",
"durations_minutes": [
60
],
"subcategory": "Longevity Arts",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Hatha",
"durations_minutes": [
60
],
"subcategory": "Longevity Arts",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Zen",
"durations_minutes": [
60
],
"subcategory": "Longevity Arts",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Yin",
"durations_minutes": [
60
],
"subcategory": "Longevity Arts",
"supports_in_room": true
},
{
"category": "Intentional Wellness",
"name": "Restorative Yoga",
"durations_minutes": [
60
],
"subcategory": "Longevity Arts",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Intro to Yoga",
"durations_minutes": [
60
],
"subcategory": "Longevity Arts",
"supports_in_room": true
},
{
"category": "Intentional Wellness",
"name": "Qigong \u2014 Microcosmic Orbit Series",
"durations_minutes": [
60
],
"subcategory": "Longevity Arts",
"supports_in_room": null
},
{
"category": "Intentional Wellness",
"name": "Qigong \u2014 Purifying the Five Elements",
"durations_minutes": [
60
],
"subcategory": "Longevity Arts",
"supports_in_room": null
},
{
"category": "Intentional Wellness",
"name": "Qigong \u2014 Standing 8 Brocades",
"durations_minutes": [
60
],
"subcategory": "Longevity Arts",
"supports_in_room": null
},
{
"category": "Intentional Wellness",
"name": "Tai Chi",
"durations_minutes": [
60
],
"subcategory": "Longevity Arts",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Guided Wellness Hike (with Yoga/Qigong/Tai Chi/Meditation)",
"durations_minutes": [
60
],
"subcategory": "Longevity Arts",
"supports_in_room": null
},
{
"category": "Intentional Wellness",
"name": "Four Pillars Astrology",
"durations_minutes": [
60
],
"subcategory": "Sacred Soul Voyages",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Personal Elemental Constitution",
"durations_minutes": [
60
],
"subcategory": "Sacred Soul Voyages",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "I Ching Consultation",
"durations_minutes": [
60
],
"subcategory": "Sacred Soul Voyages",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Season of Life",
"durations_minutes": [
60
],
"subcategory": "Light of Life Series",
"supports_in_room": false
},
{
"category": "Intentional Wellness",
"name": "Limbs of Yoga",
"durations_minutes": [
60
],
"subcategory": "Light of Life Series",
"supports_in_room": false
}
]
};

  const SEASON_DATE_RANGES = {
    "October 16Th Through November 19Th": { start: "2025-10-16", end: "2025-11-19" },
    "April 23Rd Through July 5Th": { start: "2026-04-23", end: "2026-07-05" },
    "August 28Th Through October 15Th": { start: "2025-08-28", end: "2025-10-15" },
    "March 5Th Through April 22Nd": { start: "2026-03-05", end: "2026-04-22" },
    "November 20Th Through March 4Th": { start: "2025-11-20", end: "2026-03-04" }
  };

  const DAY_NAME_TO_KEY = {
    Sunday: 'sun',
    Monday: 'mon',
    Tuesday: 'tue',
    Wednesday: 'wed',
    Thursday: 'thu',
    Friday: 'fri',
    Saturday: 'sat'
  };

  const DAY_NORMALIZATION = Object.entries(DAY_NAME_TO_KEY).reduce((acc, [name, key]) => {
    acc[name.toLowerCase()] = name;
    acc[key] = name;
    return acc;
  }, {});

  const metadataIndex = new Map();
  const seasonByName = new Map();

  function parseTimeLabel(label){
    const match = /^\s*(\d{1,2}):(\d{2})(am|pm)\s*$/i.exec(label);
    if(!match) throw new Error(`Unsupported time format: ${label}`);
    let [, hourStr, minuteStr, meridiem] = match;
    let hour = Number(hourStr);
    const minute = Number(minuteStr);
    const lower = meridiem.toLowerCase();
    if(lower === 'pm' && hour !== 12) hour += 12;
    if(lower === 'am' && hour === 12) hour = 0;
    const h = String(hour).padStart(2,'0');
    return { value: `${h}:${minuteStr}`, minutes: hour * 60 + minute };
  }

  function normalizeDayName(input){
    if(!input) return null;
    const canonical = DAY_NORMALIZATION[input.toLowerCase()];
    return canonical || null;
  }

  function makeActivityKey(seasonName, dayName, title, start){
    return [seasonName, dayName, title, start].map(part => String(part ?? '')).join('||');
  }

  function makeStableId(seasonName, dayName, title, start){
    const slug = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    return ['activity', slug(seasonName), slug(dayName), slug(title), start.replace(':','')].filter(Boolean).join('__');
  }

  const seasonsInternal = Object.entries(RAW_ACTIVITIES_DATA).map(([seasonName, seasonDays]) => {
    const range = SEASON_DATE_RANGES[seasonName] || {};
    const weeklyByKey = {};
    const dayMap = new Map();

    Object.entries(seasonDays).forEach(([dayLabel, activities]) => {
      const canonicalDay = normalizeDayName(dayLabel) || dayLabel;
      const dayKey = DAY_NAME_TO_KEY[canonicalDay] || DAY_NAME_TO_KEY[dayLabel] || null;
      if(!dayKey) return;
      const normalized = activities.map(entry => {
        const startInfo = parseTimeLabel(entry.start);
        const endInfo = parseTimeLabel(entry.end);
        const item = { title: entry.title, start: startInfo.value, end: endInfo.value };
        const metaKey = makeActivityKey(seasonName, canonicalDay, item.title, item.start);
        metadataIndex.set(metaKey, {
          location: entry.location,
          source: entry.source,
          stableId: makeStableId(seasonName, canonicalDay, item.title, item.start)
        });
        return { item, minutes: startInfo.minutes };
      });
      normalized.sort((a,b) => a.minutes - b.minutes);
      const uiList = normalized.map(entry => entry.item);
      weeklyByKey[dayKey] = uiList;
      dayMap.set(canonicalDay, uiList);
      dayMap.set(dayKey, uiList);
    });

    return {
      name: seasonName,
      start: range.start || null,
      end: range.end || null,
      weekly: weeklyByKey,
      dayMap
    };
  }).sort((a,b) => {
    if(a.start && b.start) return a.start.localeCompare(b.start);
    if(a.start) return -1;
    if(b.start) return 1;
    return a.name.localeCompare(b.name);
  });

  seasonsInternal.forEach(season => {
    seasonByName.set(season.name, season);
  });

  const seasonsPublic = seasonsInternal.map(season => ({
    name: season.name,
    start: season.start,
    end: season.end
  }));

  const spaServicesInternal = RAW_SPA_DATA.services.map(service => ({
    name: service.name,
    category: service.category,
    subcategory: service.subcategory,
    durations: service.durations_minutes.slice(),
    supportsInRoom: service.supports_in_room
  }));
  spaServicesInternal.sort((a,b) => a.name.localeCompare(b.name));

  const spaByCategory = new Map();
  const spaByName = new Map();
  spaServicesInternal.forEach(service => {
    spaByName.set(service.name, service);
    if(!spaByCategory.has(service.category)){
      spaByCategory.set(service.category, []);
    }
    spaByCategory.get(service.category).push(service);
  });
  spaByCategory.forEach(list => list.sort((a,b) => a.name.localeCompare(b.name)));
  const spaCategories = Array.from(spaByCategory.keys());

  function cloneSeason(season){
    return { name: season.name, start: season.start, end: season.end };
  }

  function cloneActivityRow(row){
    return { title: row.title, start: row.start, end: row.end };
  }

  function cloneSpaService(service){
    return {
      name: service.name,
      category: service.category,
      subcategory: service.subcategory,
      durations: service.durations.slice(),
      supportsInRoom: service.supportsInRoom
    };
  }

  function listActivitySeasons(){
    return seasonsPublic.map(cloneSeason);
  }

  function findSeasonByDateKey(dateKey){
    for(const season of seasonsInternal){
      if(season.start && season.end && dateKey >= season.start && dateKey <= season.end){
        return cloneSeason(season);
      }
    }
    return null;
  }

  function getActivitiesDataset(){
    return { seasons: listActivitySeasons() };
  }

  function getActivitiesForSeasonDay(seasonName, dayInput){
    const season = seasonByName.get(seasonName);
    if(!season) return [];
    const canonicalDay = normalizeDayName(dayInput) || dayInput;
    const dayKey = DAY_NAME_TO_KEY[canonicalDay] || DAY_NAME_TO_KEY[(canonicalDay || '').charAt(0).toUpperCase() + (canonicalDay || '').slice(1)] || canonicalDay;
    const list = season.dayMap.get(canonicalDay) || season.dayMap.get(dayKey);
    return Array.isArray(list) ? list.map(cloneActivityRow) : [];
  }

  function getActivityMetadata({ season, day, title, start }){
    const canonicalDay = normalizeDayName(day) || day;
    const key = makeActivityKey(season, canonicalDay, title, start);
    const meta = metadataIndex.get(key);
    if(!meta) return null;
    return { location: meta.location, source: meta.source, stableId: meta.stableId };
  }

  function listSpaCategories(){
    return spaCategories.slice();
  }

  function getSpaServicesByCategory(category){
    const list = spaByCategory.get(category);
    if(!list) return [];
    return list.map(cloneSpaService);
  }

  function getSpaServiceByName(name){
    const service = spaByName.get(name);
    return service ? cloneSpaService(service) : null;
  }

  function getSpaServiceDurations(name){
    const service = spaByName.get(name);
    return service ? service.durations.slice() : null;
  }

  function supportsSpaServiceInRoom(name){
    const service = spaByName.get(name);
    return service ? service.supportsInRoom : null;
  }

  function getSpaDataset(){
    return { services: spaServicesInternal.map(cloneSpaService) };
  }

  const api = {
    listActivitySeasons,
    findSeasonByDateKey,
    getActivitiesDataset,
    getActivitiesForSeasonDay,
    getActivityMetadata,
    getSpaDataset,
    listSpaCategories,
    getSpaServicesByCategory,
    getSpaServiceByName,
    getSpaServiceDurations,
    supportsSpaServiceInRoom
  };

  Object.defineProperty(global, 'CHSDataLayer', {
    value: api,
    enumerable: true,
    configurable: false,
    writable: false
  });
})(typeof window !== 'undefined' ? window : globalThis);
