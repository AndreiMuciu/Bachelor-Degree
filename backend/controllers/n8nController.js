import Settlement from "../models/settlementModel.js";

const buildSiteName = (settlement) =>
  `${settlement.name}-${settlement.judet.toUpperCase()}`;

const parseN8nResponse = async (response) => {
  const responseText = await response.text();
  if (!responseText || responseText.trim().length === 0) {
    return { status: "success" };
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
};

const isN8nSuccess = (n8nResult) => {
  return (
    n8nResult === "success" ||
    n8nResult === "suuccess" ||
    n8nResult?.status === "success" ||
    n8nResult?.status === "suuccess"
  );
};

const callN8nDeleteSite = async ({ siteName }) => {
  const n8nDeleteUrl = process.env.N8N_DELETE_SITE;
  if (!n8nDeleteUrl) {
    const error = new Error("N8N_DELETE_SITE URL not configured");
    error.statusCode = 500;
    throw error;
  }

  const n8nPayload = [{ name: siteName }];

  const n8nResponse = await fetch(n8nDeleteUrl, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(n8nPayload),
  });

  if (!n8nResponse.ok) {
    const details = await n8nResponse.text();
    const error = new Error("Failed to delete site via n8n");
    error.statusCode = 500;
    error.details = details;
    throw error;
  }

  const n8nResult = await parseN8nResponse(n8nResponse);
  if (!isN8nSuccess(n8nResult)) {
    const error = new Error("N8N did not return success status");
    error.statusCode = 500;
    error.details = n8nResult;
    throw error;
  }

  return n8nResult;
};

/**
 * Create a site via n8n webhook
 * Expected request body:
 * {
 *   settlementId: "mongoId",
 *   files: {
 *     html: "index.html content",
 *     css: "styles.css content",
 *     js: "script.js content"
 *   }
 * }
 */
export const createSite = async (req, res) => {
  try {
    console.log("=== CREATE SITE REQUEST ===");
    const { settlementId, files } = req.body;
    console.log("Settlement ID:", settlementId);
    console.log("Files received:", files ? Object.keys(files) : "no files");

    // Validate request
    if (!settlementId || !files || !files.html || !files.css || !files.js) {
      console.log("Validation failed - missing fields");
      return res.status(400).json({
        status: "fail",
        message:
          "Please provide settlementId and all required files (html, css, js)",
      });
    }

    // Get settlement from database
    const settlement = await Settlement.findById(settlementId);
    console.log(
      "Settlement found:",
      settlement ? settlement.name : "NOT FOUND",
    );

    if (!settlement) {
      return res.status(404).json({
        status: "fail",
        message: "Settlement not found",
      });
    }

    // Check if site is already active
    if (settlement.active) {
      console.log("Settlement already active");
      return res.status(400).json({
        status: "fail",
        message:
          "Settlement already has an active site. Use update endpoint instead.",
      });
    }

    // Prepare data for n8n
    const filesContent = {
      "index.html": files.html,
      "script.js": files.js,
      "styles.css": files.css,
    };

    // Add blog pages if provided
    if (files.blogHtml) {
      filesContent["blog.html"] = files.blogHtml;
    }

    if (files.postHtml) {
      filesContent["post.html"] = files.postHtml;
    }

    // Add members page if provided
    if (files.membersHtml) {
      filesContent["members.html"] = files.membersHtml;
    }

    const n8nPayload = {
      name: buildSiteName(settlement),
      "files-content": filesContent,
    };

    // Get n8n webhook URL from environment
    const n8nCreateUrl = process.env.N8N_CREATE_SITE;
    console.log("N8N URL configured:", n8nCreateUrl ? "YES" : "NO");

    if (!n8nCreateUrl) {
      return res.status(500).json({
        status: "error",
        message: "N8N_CREATE_SITE URL not configured",
      });
    }

    console.log("Calling n8n webhook...");
    // Call n8n webhook
    const n8nResponse = await fetch(n8nCreateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(n8nPayload),
    });

    console.log("N8N Response status:", n8nResponse.status);
    console.log("N8N Response ok:", n8nResponse.ok);

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.log("N8N Error response:", errorText);
      return res.status(500).json({
        status: "error",
        message: "Failed to create site via n8n",
        details: errorText,
      });
    }

    const n8nResult = await parseN8nResponse(n8nResponse);
    console.log("N8N Result:", n8nResult);

    if (!isN8nSuccess(n8nResult)) {
      console.log("N8N did not return success:", n8nResult);
      return res.status(500).json({
        status: "error",
        message: "N8N did not return success status",
        details: n8nResult,
      });
    }

    console.log("N8N confirmed success, updating settlement...");
    // Update settlement to active only if n8n confirmed success
    settlement.active = true;
    await settlement.save();

    console.log("Settlement updated successfully");
    res.status(200).json({
      status: "success",
      message: "Site created successfully",
      data: {
        settlement,
        n8nResponse: n8nResult,
      },
    });
  } catch (error) {
    console.error("=== CREATE SITE ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/**
 * Update a site via n8n webhook
 * Expected request body:
 * {
 *   settlementId: "mongoId",
 *   files: {
 *     html: "index.html content",
 *     css: "styles.css content",
 *     js: "script.js content"
 *   }
 * }
 */
export const updateSite = async (req, res) => {
  try {
    console.log("=== UPDATE SITE REQUEST ===");
    const { settlementId, files } = req.body;
    console.log("Settlement ID:", settlementId);
    console.log("Files received:", files ? Object.keys(files) : "no files");

    // Validate request
    if (!settlementId || !files || !files.html || !files.css || !files.js) {
      console.log("Validation failed - missing fields");
      return res.status(400).json({
        status: "fail",
        message:
          "Please provide settlementId and all required files (html, css, js)",
      });
    }

    // Get settlement from database
    const settlement = await Settlement.findById(settlementId);
    console.log(
      "Settlement found:",
      settlement ? settlement.name : "NOT FOUND",
    );

    if (!settlement) {
      return res.status(404).json({
        status: "fail",
        message: "Settlement not found",
      });
    }

    // Check if site is active
    if (!settlement.active) {
      console.log("Settlement NOT active - cannot update");
      return res.status(400).json({
        status: "fail",
        message:
          "Settlement does not have an active site. Use create endpoint instead.",
      });
    }

    console.log("Settlement is active, proceeding with update...");

    // Prepare data for n8n
    const filesContent = {
      "index.html": files.html,
      "script.js": files.js,
      "styles.css": files.css,
    };

    // Add blog pages if provided
    if (files.blogHtml) {
      console.log("Blog HTML included in update");
      filesContent["blog.html"] = files.blogHtml;
    }

    if (files.postHtml) {
      console.log("Post HTML included in update");
      filesContent["post.html"] = files.postHtml;
    }

    // Add members page if provided
    if (files.membersHtml) {
      console.log("Members HTML included in update");
      filesContent["members.html"] = files.membersHtml;
    }

    const n8nPayload = {
      name: buildSiteName(settlement),
      "files-content": filesContent,
    };

    // Get n8n webhook URL from environment
    const n8nUpdateUrl = process.env.N8N_UPDATE_SITE;
    console.log("N8N Update URL configured:", n8nUpdateUrl ? "YES" : "NO");

    if (!n8nUpdateUrl) {
      return res.status(500).json({
        status: "error",
        message: "N8N_UPDATE_SITE URL not configured",
      });
    }

    console.log("Calling n8n UPDATE webhook...");
    console.log("Payload name:", n8nPayload.name);
    console.log("Files to update:", Object.keys(filesContent));

    // Call n8n webhook (PATCH for update)
    const n8nResponse = await fetch(n8nUpdateUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(n8nPayload),
    });

    console.log("N8N Update Response status:", n8nResponse.status);
    console.log("N8N Update Response ok:", n8nResponse.ok);

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.log("N8N Update Error response:", errorText);
      return res.status(500).json({
        status: "error",
        message: "Failed to update site via n8n",
        details: errorText,
      });
    }

    const n8nResult = await parseN8nResponse(n8nResponse);
    console.log("N8N Update Result:", n8nResult);

    if (!isN8nSuccess(n8nResult)) {
      console.log("N8N did not return success:", n8nResult);
      return res.status(500).json({
        status: "error",
        message: "N8N did not return success status",
        details: n8nResult,
      });
    }

    console.log("N8N confirmed success for update");
    res.status(200).json({
      status: "success",
      message: "Site updated successfully",
      data: {
        settlement,
        n8nResponse: n8nResult,
      },
    });
  } catch (error) {
    console.error("=== UPDATE SITE ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/**
 * Delete a site via n8n webhook
 * Expected request body:
 * {
 *   settlementId: "mongoId"
 * }
 */
export { callN8nDeleteSite, buildSiteName };
