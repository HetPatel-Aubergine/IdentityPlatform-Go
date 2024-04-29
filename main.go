package main

import (
	"context"
	"encoding/json"
	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"log"
	"net/http"
)

var app *firebase.App
var authClient *auth.Client

func init() {
	var err error
	app, err = firebase.NewApp(context.Background(), nil)
	if err != nil {
		log.Fatalf("error initializing app: %v\n", err)
	}

	authClient, err = app.Auth(context.Background())
	if err != nil {
		log.Fatalf("error initializing app: %v\n", err)
	}
}

func verify(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	//Get the token from query params
	token := r.URL.Query().Get("token")

	// Verify the token with GCP
	user, err := authClient.VerifyIDToken(context.Background(), token)
	if err != nil {
		b, _ := json.Marshal(map[string]string{"response": "Token is expired"})
		w.WriteHeader(http.StatusBadRequest)
		w.Write(b)
		return
	}

	// Create the user and send the new user in response
	u, _ := authClient.GetUser(context.Background(), user.UID)
	b, _ := json.Marshal(u)
	w.WriteHeader(http.StatusOK)
	w.Write(b)
}

func create(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var body map[string]interface{}

	// Read the request body
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&body); err != nil {
		log.Printf("Error decoding body: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Create the user with email and password
	email := body["email"].(string)
	password := body["password"].(string)
	user := (&auth.UserToCreate{}).
		Email(email).
		EmailVerified(true).
		Password(password)

	userRecord, err := authClient.CreateUser(context.Background(), user)
	if err != nil {
		log.Printf("Error creating user: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	b, _ := json.Marshal(userRecord)
	w.WriteHeader(http.StatusOK)
	w.Write(b)
}

func main() {

	// setup router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Get("/verify", verify)
	r.Post("/create", create)

	log.Printf("Listening on port 3000\n")
	err := http.ListenAndServe(":3000", r)
	if err != nil {
		log.Fatalf("Error starting server: %v\n", err)
	}
}
