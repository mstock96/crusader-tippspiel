# Crusader Tippspiel

## Project Overview

This full-stack application is a custom prediction platform (Tippspiel) built to manage AI tournaments for the game *Stronghold Crusader Definitive Edition*. While the general structure utilizes standard tournament formats (group stages, knockout trees), the underlying calculation logic and scoring systems are explicitly tailored to the game's specific mechanics.

### Core Functionality

* **Tournament Management:** Administrators can set up custom tournament structures, including group stages and subsequent knockout trees, for the competing entities.
* **Prediction System:** Users can submit detailed predictions for tournament outcomes. This includes forecasting exact team placements during the group phase and predicting the final podium standings.
* **Simulation-Assisted Predictions:** Users have access to a simulation engine to calculate potential tournament scenarios. They can use these simulated runs to test different outcomes and formulate their final predictions.
* **Standalone Data Management:** The application serves strictly as a data management, calculation, and UI platform. It operates completely independently and does not require direct API integration with the game client.

## Tech Stack

**Frontend:**
* React (with Vite)
* TypeScript
* Mantine (UI Component Library)

**Backend:**
* Java & Spring Boot
* Spring Security (JWT-based stateless authentication)
* MapStruct (for robust DTO mapping)
* Spring Data JPA & H2 Database (for development)

## Architecture & Best Practices

* **Monorepo Structure:** Clear separation into `crusader-tippspiel-backend` and `crusader-tippspiel-frontend` directories within a single repository for straightforward review.
* **Layered Backend:** Strict separation of concerns (Controller -> Service -> Repository).
* **Robust DTO Pattern:** Entities never leave the service layer. MapStruct translates internal objects to DTOs, preventing circular references and unwanted field exposure.
* **Stateless Security:** CSRF disabled in favor of stateless REST APIs secured via custom JWT tokens, utilizing environment variables for the secret configuration.
* **Dev Profile Data Seeding:** A simple `CommandLineRunner` implementation that boots up with initial test data (an admin user, a basic tournament skeleton, and a few teams) when the `dev` profile is active, ensuring the app isn't completely empty on first launch.

## Project Structure

```text
crusader-tippspiel/
 ├── crusader-tippspiel-backend/   # Spring Boot application (REST API)
 └── crusader-tippspiel-frontend/  # React application (User Interface)
 ```
 
## Getting Started

### Prerequisites
* Java 25
* Node.js 22+

### 1. Start the Backend
The backend runs on `http://localhost:8080`.

cd crusader-tippspiel-backend
./mvnw spring-boot:run

The backend runs on `http://localhost:5173/`.
cd crusader-tippspiel-frontend
npm install
npm run dev