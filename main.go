package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/micro/go-micro/client"
	"github.com/micro/go-web"
	"golang.org/x/net/context"

	common "github.com/microhq/location-srv/proto"
	loc "github.com/microhq/location-srv/proto/location"
)

type Feature struct {
	Type       string
	Properties map[string]interface{}
	Geometry   Geometry
}

type Geometry struct {
	Type        string
	Coordinates [][2]float64
}

type Route struct {
	Type     string
	Features []Feature
}

var (
	Name     = "go.micro.web.location"
	Address  = "0.0.0.0:9090"
	Interval = time.Minute
)

func requestEntity(typ string, num int64, radius, lat, lon float64) ([]*common.Entity, error) {
	req := client.NewRequest("go.micro.srv.location", "Location.Search", &loc.SearchRequest{
		Center: &common.Point{
			Latitude:  lat,
			Longitude: lon,
		},
		Type:        typ,
		Radius:      radius,
		NumEntities: num,
	})

	rsp := &loc.SearchResponse{}
	err := client.Call(context.Background(), req, rsp)
	if err != nil {
		return nil, err
	}
	return rsp.Entities, nil
}

func saveEntity(id, typ string, lat, lon float64) {
	entity := &common.Entity{
		Id:   id,
		Type: typ,
		Location: &common.Point{
			Latitude:  lat,
			Longitude: lon,
			Timestamp: time.Now().Unix(),
		},
	}

	req := client.NewRequest("go.micro.srv.location", "Location.Save", &loc.SaveRequest{
		Entity: entity,
	})

	rsp := &loc.SaveResponse{}

	if err := client.Call(context.Background(), req, rsp); err != nil {
		fmt.Println(err)
		return
	}
}

func start(routeFile string) {
	b, _ := ioutil.ReadFile(routeFile)
	var route Route
	err := json.Unmarshal(b, &route)
	if err != nil {
		fmt.Errorf("erroring read route: %v", err)
		return
	}

	coords := route.Features[0].Geometry.Coordinates

	for i := 0; i < 20; i++ {
		go runner(fmt.Sprintf("%s-%d", routeFile, time.Now().UnixNano()), "runner", coords)
		time.Sleep(time.Minute)
	}
}

func runner(id, typ string, coords [][2]float64) {
	for {
		for i := 0; i < len(coords); i++ {
			saveEntity(id, typ, coords[i][1], coords[i][0])
			time.Sleep(time.Second * 5)
		}

		for i := len(coords) - 1; i >= 0; i-- {
			saveEntity(id, typ, coords[i][1], coords[i][0])
			time.Sleep(time.Second * 5)
		}
	}
}

func objectHandler(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	lat, _ := strconv.ParseFloat(r.Form.Get("lat"), 64)
	lon, _ := strconv.ParseFloat(r.Form.Get("lon"), 64)

	e, err := requestEntity("runner", 100, 1500.0, lat, lon)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	b, err := json.Marshal(e)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Write(b)
}

func main() {
	service := web.NewService(
		web.Name("go.micro.web.geo"),
		web.Version("latest"),
	)

	service.Handle("/", http.FileServer(http.Dir("html")))
	service.HandleFunc("/objects", objectHandler)

	if err := service.Init(); err != nil {
		log.Fatal(err)
	}

	go func() {
		for _, r := range []string{
			"routes/strand.json",
			"routes/holborn.json",
		} {
			time.Sleep(time.Second * 10)
			go start(r)
		}
	}()

	if err := service.Run(); err != nil {
		log.Fatal(err)
	}
}
