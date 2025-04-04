const fs = require("fs");

// Function to compute haversine distance (in meters) between two [lon, lat] coordinates.
function haversineDistance(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const toRad = (angle) => (angle * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Compute centroid of a LineString given an array of [lon, lat] coordinates.
function computeCentroid(coordinates) {
  let sumLat = 0,
    sumLon = 0;
  coordinates.forEach((coord) => {
    sumLon += coord[0];
    sumLat += coord[1];
  });
  const count = coordinates.length;
  return [sumLon / count, sumLat / count];
}

// Check whether the topology is classified as a motorway based on functionalClass.value (3 or 4).
function isMotorwayByFunctionalClass(topologyFeature) {
  if (!topologyFeature.properties.functionalClass) return false;
  return topologyFeature.properties.functionalClass.some(
    (fc) => fc.value === 1 || fc.value === 2
  );
}

// Extract topology id from the error message using a regex.
function extractTopologyId(errorMessage) {
  const regex = /urn:here::here:Topology:\S+/;
  const match = errorMessage.match(regex);
  return match ? match[0] : null;
}

// Process the current topology by comparing it with an array of candidate topology objects.
function compareTopologyWithCandidates(currentTopology, candidateTopologies) {
  // Compute the centroid of the current topology.
  const currentCentroid = computeCentroid(currentTopology.geometry.coordinates);
  //   console.log("Current topology centroid: for topo", currentCentroid);
  console.log(
    "current topology",
    currentTopology.properties.id,
    " & centroid:",
    currentCentroid
  );

  candidateTopologies.forEach((candidate, idx) => {
    const candidateCentroid = computeCentroid(candidate.geometry.coordinates);
    const distance = haversineDistance(currentCentroid, candidateCentroid);

    if (distance < 20) {
      if (isMotorwayByFunctionalClass(candidate)) {
        if (
          candidate.properties.roads &&
          candidate.properties.roads.length > 0
        ) {
          console.log(
            `Candidate topology ${idx} is within 20m and classified as motorway. Associated road(s):`,
            candidate.properties.roads
          );
        } else {
          console.log(
            `Candidate topology ${idx} is within 20m and classified as motorway but has no associated road data.`
          );
        }
      } else {
        console.log(
          `Candidate topology ${idx} is within 20m but not classified as a motorway (functionalClass value is not 1 or 2).`
        );
      }
    }
  });
}

const validationsFilePath = "23599610_validations.geojson";

fs.readFile(validationsFilePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading validations file:", err);
    return;
  }
  try {
    const validationsData = JSON.parse(data);
    validationsData.features.forEach((feature, index) => {
      const errorMessage = feature.properties["Error Message"];
      const currentTopologyId = extractTopologyId(errorMessage);
      console.log("Checking validation for violation:", index + 1);
      console.log("Extracted current topology id:", currentTopologyId);

      // Load the full topology JSON from file instead of using a hard-coded array.
      const topologyFilePath = "23599610_full_topology_data.geojson";

      fs.readFile(topologyFilePath, "utf8", (err, data) => {
        if (err) {
          console.error("Error reading topology file:", err);
          return;
        }
        try {
          const topologyData = JSON.parse(data);
          // Assume the full topology file is a FeatureCollection.
          const allTopologies = topologyData.features;

          // Find the current topology feature from allTopologies.
          const currentTopology = allTopologies.find(
            (t) => t.properties.id === currentTopologyId
          );

          if (currentTopology) {
            // Check if currentTopology functionalClass is NOT 1 or 2.
            if (!isMotorwayByFunctionalClass(currentTopology)) {
              // Create an array of candidate topologies (excluding the current topology).
              const candidateTopologies = allTopologies.filter(
                (t) => t.properties.id !== currentTopologyId
              );
              // Compare the current topology with the candidate topologies.
              compareTopologyWithCandidates(
                currentTopology,
                candidateTopologies
              );
            } else {
              console.log(
                "Current topology is classified as a motorway (functionalClass value is 1 or 2). No further checks needed."
              );
            }
          } else {
            console.log("Current topology not found in the loaded data.");
          }
        } catch (parseError) {
          console.error("Error parsing topology file:", parseError);
        }
      });
    });
  } catch (parseError) {
    console.error("Error parsing validations JSON:", parseError);
  }
});
