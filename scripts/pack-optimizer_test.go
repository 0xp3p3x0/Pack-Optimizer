package main

import (
	"fmt"
	"testing"
)

func TestOptimizePacks(t *testing.T) {
	testCases := []struct {
		input         int
		expectedItems int
		expectedPacks int
		description   string
	}{
		{1, 250, 1, "Single item should use smallest pack"},
		{250, 250, 1, "Exact pack size"},
		{251, 500, 1, "Just over pack size should use next larger pack"},
		{501, 750, 2, "Multiple packs needed"},
		{12001, 12250, 4, "Large order optimization"},
	}

	for _, tc := range testCases {
		t.Run(tc.description, func(t *testing.T) {
			result, err := OptimizePacks(tc.input)
			if err != nil {
				t.Fatalf("OptimizePacks(%d) returned error: %v", tc.input, err)
			}

			if result.TotalItems != tc.expectedItems {
				t.Errorf("OptimizePacks(%d) total items = %d, want %d",
					tc.input, result.TotalItems, tc.expectedItems)
			}

			if result.TotalPacks != tc.expectedPacks {
				t.Errorf("OptimizePacks(%d) total packs = %d, want %d",
					tc.input, result.TotalPacks, tc.expectedPacks)
			}

			// Verify that the solution fulfills the order
			if result.TotalItems < tc.input {
				t.Errorf("OptimizePacks(%d) total items %d < order quantity %d",
					tc.input, result.TotalItems, tc.input)
			}

			// Verify waste calculation
			expectedWaste := result.TotalItems - tc.input
			if result.Waste != expectedWaste {
				t.Errorf("OptimizePacks(%d) waste = %d, want %d",
					tc.input, result.Waste, expectedWaste)
			}
		})
	}
}

func TestOptimizePacksInvalidInput(t *testing.T) {
	testCases := []int{0, -1, -100}

	for _, input := range testCases {
		t.Run(fmt.Sprintf("Invalid input %d", input), func(t *testing.T) {
			result, err := OptimizePacks(input)
			if err == nil {
				t.Errorf("OptimizePacks(%d) should return error for invalid input", input)
			}
			if result != nil {
				t.Errorf("OptimizePacks(%d) should return nil result for invalid input", input)
			}
		})
	}
}

func BenchmarkOptimizePacks(b *testing.B) {
	testCases := []int{1, 250, 501, 1000, 12001}

	for _, quantity := range testCases {
		b.Run(fmt.Sprintf("Quantity_%d", quantity), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				OptimizePacks(quantity)
			}
		})
	}
}
