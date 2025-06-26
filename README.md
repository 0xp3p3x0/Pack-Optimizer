# Pack Optimizer

A full-stack application that calculates optimal pack combinations to fulfill orders with minimal waste and pack count.

## 🏗️ Architecture

- **Backend**: Go HTTP API server with CORS support
- **Frontend**: Next.js React application with TypeScript
- **Algorithm**: Dynamic programming optimization with configurable pack sizes

## 🚀 Getting Started

### Prerequisites

- Go 1.19+ installed
- Node.js 18+ installed
- npm or yarn package manager

### Running the Application

1. **Start the Go API Server**:
   ```
   cd scripts
   go mod tidy
   go run pack-optimizer.go
   ```
   The API will start on `http://localhost:8080`

2. **Start the Frontend** (in a new terminal):
   ```bash
   npm install
   npm run dev
   ```
   The frontend will start on `http://localhost:3000`

## 📡 API Endpoints

- `POST /optimize` - Calculate optimal pack combinations
- `GET /package` - Get current pack sizes configuration
- `POST /package` - Set current pack sizes configuration
- `GET /health` - Health check endpoint

## 🧪 Testing

### Go Unit Tests
```bash
go test scripts/pack-optimizer_test.go scripts/pack-optimizer.go -v
```

## ⚙️ Configuration

Pack sizes are configurable in the Go server without code changes by modifying the `PackSizes` variable in `scripts/pack-optimizer.go`.

Current pack sizes: 250, 500, 1000, 2000, 5000 items

## 📊 Example Results

- Order 1 → 1×250 (not 1×500 - minimizes waste)
- Order 250 → 1×250 (exact match)
- Order 251 → 1×500 (fewer packs than 2×250)
- Order 501 → 1×500 + 1×250 (optimal combination)
- Order 12001 → 2×5000 + 1×2000 + 1×250 (large order optimization)

## 🔧 Development

The application uses:
- **Go**: Standard library HTTP server with JSON handling
- **React**: Modern hooks-based components with TypeScript
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality UI components

## 🌐 CORS Configuration

The Go server includes CORS headers to allow frontend integration from different origins.