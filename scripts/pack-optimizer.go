package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"sort"
)

// PackResult represents a pack size and quantity combination
type PackResult struct {
	PackSize int `json:"packSize"`
	Quantity int `json:"quantity"`
}

// OptimizationResult represents the complete optimization result
type OptimizationResult struct {
	OrderQuantity int          `json:"orderQuantity"`
	TotalItems    int          `json:"totalItems"`
	TotalPacks    int          `json:"totalPacks"`
	Packs         []PackResult `json:"packs"`
	Waste         int          `json:"waste"`
}

// Configuration for pack sizes
var PackSizes = []int{250, 500, 1000, 2000, 5000}

// CORS middleware
func enableCORS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
}

// OptimizePacks implements the core pack optimization algorithm
func OptimizePacks(orderQuantity int) (*OptimizationResult, error) {
	if orderQuantity <= 0 {
		return nil, fmt.Errorf("order quantity must be positive")
	}

	sort.Sort(sort.Reverse(sort.IntSlice(PackSizes)))

	// Define upper limit: orderQuantity + max pack size
	maxSize := orderQuantity + PackSizes[0]

	// DP table: dp[i] = {totalPacks, prevAmount, lastUsedPack}
	type dpEntry struct {
		packs int
		prev  int
		pack  int
	}

	dp := make([]dpEntry, maxSize+1)
	for i := range dp {
		dp[i].packs = math.MaxInt32
	}
	dp[0] = dpEntry{packs: 0, prev: -1, pack: 0}

	for i := 0; i <= maxSize; i++ {
		if dp[i].packs == math.MaxInt32 {
			continue
		}
		for _, pack := range PackSizes {
			if i+pack <= maxSize {
				if dp[i].packs+1 < dp[i+pack].packs {
					dp[i+pack] = dpEntry{
						packs: dp[i].packs + 1,
						prev:  i,
						pack:  pack,
					}
				}
			}
		}
	}

	// Find minimal totalItems ≥ orderQuantity
	bestAmount := -1
	for i := orderQuantity; i <= maxSize; i++ {
		if dp[i].packs != math.MaxInt32 {
			bestAmount = i
			break
		}
	}

	if bestAmount == -1 {
		panic("No valid solution found")
	}

	// Backtrack to find pack breakdown
	counts := make(map[int]int)
	for cur := bestAmount; cur > 0; {
		p := dp[cur].pack
		counts[p]++
		cur = dp[cur].prev
	}

	// Build result
	packResults := []PackResult{}
	totalPacks := 0
	for _, size := range PackSizes {
		if qty, ok := counts[size]; ok {
			packResults = append(packResults, PackResult{PackSize: size, Quantity: qty})
			totalPacks += qty
		}
	}

	return &OptimizationResult{
		OrderQuantity: orderQuantity,
		TotalItems:    bestAmount,
		TotalPacks:    totalPacks,
		Packs:         packResults,
		Waste:         bestAmount - orderQuantity,
	}, nil
}

// HTTP handler for pack optimization
func optimizeHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	if r.Method == "OPTIONS" {
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		Quantity int `json:"quantity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if request.Quantity <= 0 {
		http.Error(w, "Quantity must be positive", http.StatusBadRequest)
		return
	}

	result, err := OptimizePacks(request.Quantity)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// Health check endpoint
func healthHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	if r.Method == "OPTIONS" {
		return
	}

	response := struct {
		Status  string `json:"status"`
		Message string `json:"message"`
	}{
		Status:  "healthy",
		Message: "Pack Optimizer API is running",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func packageHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	if r.Method == http.MethodPost {
		var request struct {
			PackSizes []int `json:"packSizes"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		for _, size := range request.PackSizes {
			if size <= 0 {
				http.Error(w, "All pack sizes must be positive integers", http.StatusBadRequest)
				return
			}
		}

		uniquePackSizes := make(map[int]struct{})
		// Check for uniqueness
		for _, size := range request.PackSizes {
			if _, exists := uniquePackSizes[size]; exists {
				http.Error(w, "All package sizes must be unique", http.StatusBadRequest)
				return
			}
			uniquePackSizes[size] = struct{}{}
		}

		PackSizes = request.PackSizes

		response := struct {
			Message string `json:"message"`
		}{
			Message: "Pack sizes updated successfully",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	// Handle GET to retrieve current pack sizes
	if r.Method == http.MethodGet {
		response := struct {
			PackSizes []int  `json:"packSizes"`
			Message   string `json:"message"`
		}{
			PackSizes: PackSizes,
			Message:   "Current pack sizes configuration",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}


func main() {
	http.HandleFunc("/optimize", optimizeHandler)
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/packages", packageHandler)

	port := "8080"
	if p := os.Getenv("PORT"); p != "" {
		port = p
	}

	fmt.Printf("🚀 Pack Optimizer API server starting on port %s\n", port)
	fmt.Println("📋 Available endpoints:")
	fmt.Println("  POST /optimize - Optimize pack combinations")
	fmt.Println("  GET /packages - Get pack sizes configuration")
	fmt.Println("  POST /packages - Update pack sizes configuration")
	fmt.Println("  GET /health - Health check")


	fmt.Printf("🌐 Server URL: http://localhost:%s\n", port)

	log.Fatal(http.ListenAndServe(":"+port, nil))
}
