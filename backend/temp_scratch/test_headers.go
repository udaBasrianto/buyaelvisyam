//go:build ignore

package main

import (
	"fmt"
	"net/http"
	"time"
)

func main() {
	url := "https://buyaelvisyam.id/wp-json/wp/v2/posts?per_page=1"
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "application/json, text/plain, */*")
	
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return
	}
	defer resp.Body.Close()

	fmt.Printf("STATUS: %d\n", resp.StatusCode)
	fmt.Printf("X-WP-Total: %s\n", resp.Header.Get("X-WP-Total"))
	fmt.Printf("Link: %s\n", resp.Header.Get("Link"))

    // Print all headers to be sure
    fmt.Println("All Headers:")
    for k, v := range resp.Header {
        fmt.Printf("%s: %v\n", k, v)
    }
}
