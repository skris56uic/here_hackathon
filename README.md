# Spatial Validation Automation Solutions

This repository contains JavaScript-based solutions for automating spatial validations for HERE Technologies map data. The solutions address key hackathon scenarios by extracting identifiers from error messages, matching them with corresponding GeoJSON features, and deducing critical attributes using custom heuristics.

---

## Overview

This project demonstrates three key solutions:

- **Scenario 1: Removing Outdated Signs**  
  - Checks for the existence of a sign in the signs dataset by extracting its identifier from a validation error message.
  - If the sign is not found, it is considered outdated and flagged for removal from the signs dataset.

- **Scenario 2: Correcting Sign-to-Road Associations**  
  - Extracts a topology ID from a validation error message.
  - Compares the current topology with candidate topology objects using centroid distances.
  - Verifies that a candidate topology is classified as a motorway by checking its functional class (value 3 or 4).
  - Prints the associated road information if the candidate is within 20 meters.

- **Scenario 3: Deducing Pedestrian Access from Topology**  
  - Extracts the topology ID from a validation error message.
  - Retrieves the corresponding topology feature from the dataset.
  - Analyzes the `accessCharacteristics` object within the topology.
  - Ignores any explicit pedestrian flag and instead deduces pedestrian access by examining allowed vehicle modes (auto, bicycle, bus, carpool, delivery, emergencyVehicle, motorcycle, taxi, truck, and throughTraffic).  
  - Uses a heuristic (e.g., if many vehicle modes are allowed the road is likely vehicular and not pedestrian friendly) to decide whether pedestrian access should be enabled.

---

## Repository Structure

- **`scenario_1.js`**  
  Contains the solution for Scenario 1: detecting and flagging outdated sign records (no sign in reality).

- **`scenario_2.js`**  
  Contains the solution for Scenario 2: correcting sign-to-road associations by comparing topology data.

- **`scenario_3.js`**  
  Contains the solution for Scenario 3: deducing pedestrian access based on the topology’s `accessCharacteristics` object.

- **`README.md`**  
  This file, which provides an overview, usage instructions, and detailed explanations.

---

## Prerequisites

- **Node.js**  
  Ensure [Node.js](https://nodejs.org/) is installed on your system to run the JavaScript files.

---

## Getting Started

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
