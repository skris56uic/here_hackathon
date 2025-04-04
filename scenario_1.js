const fs = require("fs");

// Function to extract the sign ID from the error message using a regex
function extractSignId(errorMessage) {
  // This regex finds strings that start with 'urn:here::here:signs:' followed by non-space characters
  const regex = /(urn:here::here:signs:\d+)/;
  const match = errorMessage.match(regex);
  return match ? match[0] : null;
}

// Function to check one violation against the signs dataset
function checkViolationAgainstSign(violation, signs) {
  // Extract the error message from the violation properties
  const errorMessage = violation.properties["Error Message"];
  // Extract the sign ID from the error message
  const signId = extractSignId(errorMessage);

  if (!signId) {
    console.log(`No sign ID found in error message: ${errorMessage}`);
    return;
  }

  // Find the sign in the dataset that matches the extracted sign ID
  const sign = signs.find((s) => s.properties.id === signId);

  if (!sign) {
    console.log(`Sign with ID ${signId} not found in the signs dataset.`);
    return;
  }

  // Check that the sign type is MOTORWAY
  if (sign.properties.signType !== "MOTORWAY") {
    console.log(
      `Sign ${signId} fails: signType is ${sign.properties.signType} (expected "MOTORWAY").`
    );
    return;
  }

  // Find the EXISTENCE confidence score in the simpleScores array
  const existenceScoreObj = sign.properties.confidence.simpleScores.find(
    (score) => score.scoreType === "EXISTENCE"
  );

  const classificationScoreObj = sign.properties.confidence.simpleScores.find(
    (score) => score.scoreType === "CLASSIFICATION"
  );

  if (!existenceScoreObj) {
    console.log(`Sign ${signId} fails: No EXISTENCE score found.`);
    return;
  }

  if (existenceScoreObj.score <= 0.75) {
    console.log(
      `Sign ${signId} fails: EXISTENCE score is ${existenceScoreObj.score} (expected > 0.75).`
    );
    return;
  }

  if (!classificationScoreObj) {
    console.log(`Sign ${signId} fails: No CLASSIFICATION score found.`);
    return;
  }

  if (classificationScoreObj.score <= 0.75) {
    console.log(
      `Sign ${signId} fails: CLASSIFICATION score is ${classificationScoreObj.score} (expected > 0.75).`
    );
    return;
  }

  // Verify that gfrGroupName is "Motorway"
  if (sign.properties.gfrGroupName !== "Motorway") {
    console.log(
      `Sign ${signId} fails: gfrGroupName is ${sign.properties.gfrGroupName} (expected "Motorway").`
    );
    return;
  }
  

  console.log(`Sign ${signId} passes all checks.`);
}

const validationsFilePath = "23599610_validations.geojson";

fs.readFile(validationsFilePath, "utf8", (err, data) => {
  console.log("Reading validations file:", validationsFilePath);
  if (err) {
    console.error("Error reading validations file:", err);
    return;
  }

  try {
    const validationsData = JSON.parse(data);

    if (!validationsData.features || validationsData.features.length === 0) {
      console.log("No validations found in the file.");
      return;
    }

    // Use the features from the validations file as violations
    const violations = validationsData.features;

    // Load signs file instead of using a hard-coded signs array
    const signsFilePath = "23599610_signs.geojson";
    fs.readFile(signsFilePath, "utf8", (err, signsData) => {
      console.log("Reading signs file:", signsFilePath);
      if (err) {
        console.error("Error reading signs file:", err);
        return;
      }

      try {
        const signsJson = JSON.parse(signsData);

        if (!signsJson.features || signsJson.features.length === 0) {
          console.log("No signs found in the file.");
          return;
        }
        // Use the features from the signs file as signs
        const signs = signsJson.features;

        // Loop through all violations and perform the checks using the loaded signs data
        violations.forEach((violation) => {
          checkViolationAgainstSign(violation, signs);
        });
      } catch (parseError) {
        console.error("Error parsing signs file:", parseError);
      }
    });
  } catch (parseError) {
    console.error("Error parsing validations file:", parseError);
  }
});
