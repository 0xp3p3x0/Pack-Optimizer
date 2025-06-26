// API configuration and client for Go backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export interface PackResult {
  packSize: number
  quantity: number
}

export interface OptimizationResult {
  orderQuantity: number
  totalItems: number
  totalPacks: number
  packs: PackResult[]
  waste: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// Check if Go API server is running
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    return response.ok
  } catch (error) {
    return false
  }
}

// Optimize pack combinations
export async function optimizePacks(quantity: number): Promise<OptimizationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new ApiError(`API Error: ${errorText}`, response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError("Failed to connect to Go API server. Make sure it's running on port 8080.")
  }
}

// Get pack sizes configuration
export async function getPackSizes(): Promise<{ packSizes: number[]; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/configPackages`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new ApiError("Failed to get pack sizes configuration", response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError("Failed to connect to Go API server")
  }
}

// Set pack sizes configuration
export async function setPackSizes(packSizes: number[]): Promise<boolean> {
  // Check if all package sizes are unique before sending to backend
  const uniquePackSizes = Array.from(new Set(packSizes));  // Removes duplicates
  if (uniquePackSizes.length !== packSizes.length) {
    throw new ApiError("All package sizes must be unique.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/configPackages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ packSizes }), // Sending the pack sizes in the request body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`API Error: ${errorText}`, response.status);
    }

    // If the request was successful, return true
    return true;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to connect to Go API server.");
  }
}
