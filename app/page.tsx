"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Package, Calculator, AlertCircle } from "lucide-react"
import { optimizePacks, checkApiHealth, getPackSizes, type OptimizationResult, ApiError } from "@/lib/api"

export default function PackOptimizer() {
  const [orderQuantity, setOrderQuantity] = useState("")
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null)
  const [packSizes, setPackSizes] = useState<number[]>([250, 500, 1000, 2000, 5000])

  // Check API health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await checkApiHealth()
      setApiHealthy(healthy)

      if (healthy) {
        try {
          const config = await getPackSizes()
          setPackSizes(config.packSizes)
        } catch (error) {
          console.warn("Failed to get pack sizes configuration")
        }
      }
    }

    checkHealth()
  }, [])

  const handleOptimize = async () => {
    if (!orderQuantity || Number.parseInt(orderQuantity) <= 0) {
      setError("Please enter a valid quantity")
      return
    }

    setLoading(true)
    setError("")

    try {
      const data = await optimizePacks(Number.parseInt(orderQuantity))
      setResult(data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  const examples = [
    { order: 1, description: "Single item" },
    { order: 250, description: "Exact pack size" },
    { order: 251, description: "Just over pack size" },
    { order: 501, description: "Multiple packs needed" },
    { order: 12001, description: "Large order" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Package className="h-8 w-8 text-blue-600" />
            Pack Optimizer
          </h1>
          <p className="text-gray-600">Calculate the optimal combination of packs to fulfill your order</p>
        </div>

        {/* API Status Alert */}
        {apiHealthy !== null && (
          <Alert className={apiHealthy ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <AlertDescription className={apiHealthy ? "text-green-800" : "text-red-800"}>
              {apiHealthy
                ? "✅ Go API Server is running and healthy"
                : "❌ Go API Server is not responding. Please start the server with: go run scripts/pack-optimizer.go"}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Order Calculator
            </CardTitle>
            <CardDescription>Available pack sizes: {packSizes.join(", ")} items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter quantity to order"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleOptimize()}
                min="1"
                disabled={!apiHealthy}
              />
              <Button onClick={handleOptimize} disabled={loading || !apiHealthy}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Optimize"}
              </Button>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {examples.map((example) => (
                <Button
                  key={example.order}
                  variant="outline"
                  size="sm"
                  onClick={() => setOrderQuantity(example.order.toString())}
                  className="text-xs"
                  disabled={!apiHealthy}
                >
                  {example.order}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">Optimization Result</CardTitle>
              <CardDescription>Order for {result.orderQuantity.toLocaleString()} items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.totalItems.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.totalPacks}</div>
                  <div className="text-sm text-gray-600">Total Packs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{result.waste.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Waste Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {((result.waste / result.totalItems) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Waste Rate</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Pack Breakdown:</h3>
                <div className="flex flex-wrap gap-2">
                  {result.packs.map((pack, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {pack.quantity}× {pack.packSize.toLocaleString()} items
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Summary:</strong> To fulfill an order of {result.orderQuantity.toLocaleString()} items, send{" "}
                  {result.totalPacks} pack{result.totalPacks !== 1 ? "s" : ""} containing{" "}
                  {result.totalItems.toLocaleString()} items total, with {result.waste.toLocaleString()} excess item
                  {result.waste !== 1 ? "s" : ""}.
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
