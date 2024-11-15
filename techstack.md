# Tech Stack for KGPZ
## Dynamic
- Server Rendered
- No DB, just use Git for versioning
    - Need to not reclone everything on change, but pull
    - Need to have a URL to register a webhook (in process)
    - Need to have a fallback -> first clone & and all pulls to disk?
        -> we use this to be able to manually put the repo in the base dir
    - Settings: Github Webhook URL, Maybe second path for dynamically cloned data
- Either: This is dynamic, implement metadata search as dynamically generated
    - Or: This is static, implement metadata search with lunr.js or sth similar.

## Static
- Implement SSG, by enumeration of endpoint parameters
- Implement basic search for metadata (persons, places, works, etc) in lunr.js and have it work client side
    -> Maybe we need to implement metadata search client-side with priority since it can be combined with the dynamic approach.
    -> {{- if .enumerate -}} could work implementing different functions on fitering
- No full text search available in this model

## Common
- HTMX + Go, with progressive enhancement
    - Settings: Git URL, folder path for repo
- Integration with Git repo / local folder (same thing)
- Integration with GND:
    - Need to pull in and read MARCXML for alternative names, life data (?), canonical name and professions
    - Cache MARCXML in a local folder
    - Settings: GND URL, folder path for MARCXML
- Integration with Geonames:
    - Need to pull in and read geonames data for places: alternative names, country, lat/long, wikipedia, maybe even dbpedia
    - Cache geonames data in a local folder
    - Settings: Geonames URL, folder path for geonames data
- First Version: use simple image folder for images
    -> Maybe push everything to S3 storage
- We could implement aggressive caching, but im not sure if it is necessary 

## On Startup
- Read in settings
- Read local git directory and parse as described below, creating caches (use geonames and gnd folders for caching to not overload the services)

## On Parse
- Read in files and save in local folder
- Get commit date & hash from git if possible
- Read in structs: persons, works, places, stuecke, beitraege
    - Persons: Get metadata from GND (background job) to enrich person structs, where not availble, update, if possible
        -> Use local folder as cache, and dont update in development
        - Endpoints: Person overview(s), person search
    - Works: do nothing
        - Endpoints: Works, all Beiträge pages
    - Places: get metadata from geonames, if available, dont update (just do it once)
        -> Use local folder as cache, and dont update
        - Endpoints: places overview
    - Stücke: validate dates, get weekdays, get human readable months 
        - Endpoints: Stücke overview (Index), Date search
    - Categories: read in category descriptions
        - Endpoints: Categories overview
    - Beiträge: devise categories from beiträge, if possible
        - Endpoints: all Beträge pages

## On Webhook Update
- Pull in data
- Restart

## File Inaccurancies:
- No canonical names for Actors, can use GND for most of them
- URL values YYYY/ST and YYYY/ST/P and YYYY/ST/Beilage/P? Are they unique?
- Which names of places should be used? Example: Mitau, Jelgava, Jelgava (Mitau), Mitau (Jelgava)
- Titel der Werke: not saved yet
- Kurzzitat: KGPZ St. 2, 14 Januar 1774 ? 
    - Besser: KGPZ 2/1774, 14. Januar
- Navigation: Galerie / Durchklicken??
- Weniger Kästen / Volle Seitenbreite ausnutzen
    - Horizontale Jahresnavigation durch vertikale ersetzen, so wie in der Einzelansicht
- Was ist "Link auf seite teilen"? -> Permalink

## Überarbeiten
- Undifferenzierte Angabe von "Akteur" von Werken in der Kurzangabe, Differenzieren
- Jahr
- Kurztitel, Titel
- Sekundärüberlieferung in Stück/Beitrag
- Fehlende Daten in Stück/Beitrag
- Kurzinformation Überlieferung
- Link je Jahrgang gleich, in der Primärüberlieferung
- Anzahl der Beiträge in der Primärüberlieferung
- Logo
- Sortiername ohne GND eintrag
