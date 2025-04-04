const fs = require("fs");

// Function to extract the topology id from an error message.
// Example: "Validation error: Topology id urn:here::here:Topology:107037225 encountered an issue."
function extractTopologyId(errorMessage) {
  const regex = /urn:here::here:Topology:\S+/;
  const match = errorMessage.match(regex);
  return match ? match[0] : null;
}

// Function to find the topology feature by id from an array of topology features.
function findTopologyById(topologies, topologyId) {
  return topologies.find((feature) => feature.properties.id === topologyId);
}

// Heuristic: deduce pedestrian access from the topology’s accessCharacteristics.
// We ignore the explicit pedestrian flag and instead count allowed vehicle modes.
// The keys checked are: auto, bicycle, bus, carpool, delivery, emergencyVehicle, motorcycle, taxi, truck, and throughTraffic.
// If many of these (e.g. eight or more) are allowed, we assume the road is built for high-speed, vehicular use and pedestrian access is unlikely.
function deducePedestrianAccessFromTopology(topologyFeature) {
  if (
    !topologyFeature.properties.accessCharacteristics ||
    topologyFeature.properties.accessCharacteristics.length === 0
  ) {
    console.log("No accessCharacteristics data available");
    return false;
  }

  const characteristics = topologyFeature.properties.accessCharacteristics[0];
  // List of keys representing allowed vehicle types (ignore any explicit pedestrian flag)
  const keysToCheck = [
    "auto",
    "bicycle",
    "bus",
    "carpool",
    "delivery",
    "emergencyVehicle",
    "motorcycle",
    "taxi",
    "truck",
    "throughTraffic",
  ];

  let allowedCount = 0;
  keysToCheck.forEach((key) => {
    console.log(`Key: ${key}, Value: ${characteristics[key]}`);
    if (characteristics[key] === true || characteristics[key] === 1) {
      allowedCount++;
    }
  });

  console.log(
    "Allowed vehicle types count (excluding pedestrian):",
    allowedCount
  );
  // If most vehicle types are allowed (e.g., 8 or more out of 10), then we assume pedestrian access is unlikely.
  return allowedCount < 8;
}

const validationsFilePath = "23599610_validations.geojson";
const topologyFilePath = "23599610_full_topology_data.geojson";

// First load the validations file.
fs.readFile(validationsFilePath, "utf8", (err, validationsData) => {
  if (err) {
    console.error("Error reading validations file:", err);
    return;
  }
  try {
    const validationsJson = JSON.parse(validationsData);
    // Map each validation to an object with errorMessage and extracted topologyId.
    const validationsArray = validationsJson.features.map((feature) => {
      const errorMessage = feature.properties["Error Message"];
      const topologyId = extractTopologyId(errorMessage);
      return { errorMessage, topologyId };
    });

    // Load the topology data file once.
    fs.readFile(topologyFilePath, "utf8", (err, topologyData) => {
      if (err) {
        console.error("Error reading topology data file:", err);
        return;
      }
      try {
        const topologyJson = JSON.parse(topologyData);
        const topologyDataArray = topologyJson.features;

        // Process each validation using the preloaded topology data.
        validationsArray.forEach(({ errorMessage, topologyId }, index) => {
          const currentTopology = findTopologyById(
            topologyDataArray,
            topologyId
          );
          if (currentTopology) {
            const pedestrianAccessAllowed =
              deducePedestrianAccessFromTopology(currentTopology);
            if (pedestrianAccessAllowed) {
              console.log(
                `Based on accessCharacteristics, pedestrian access SHOULD be ENABLED for topology ${topologyId}.`
              );
            } else {
              console.log(
                `Based on accessCharacteristics, pedestrian access SHOULD be DISABLED for topology ${topologyId}.`
              );
            }
          } else {
            console.log(`No topology feature found for id ${topologyId}.`);
          }
          console.log(""); // For readability between validations.
        });
      } catch (parseError) {
        console.error("Error parsing topology JSON:", parseError);
      }
    });
  } catch (parseError) {
    console.error("Error parsing validations JSON:", parseError);
  }
});
