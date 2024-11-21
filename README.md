# Outline Distribution

This project provides a lightweight system for distributing access keys to Outline VPN services. It leverages [Google Apps Script](https://developers.google.com/apps-script) to host the service using a high-collateral shared domain (`scripts.google.com`) and to authenticate users.

### Features
The implementation is straightforward, consisting of only [~80 lines of code](https://github.com/fortuna/OutlineDistribution/blob/main/Code.js). It defines two web endpoints:

1. **Home Page**  
   A welcoming interface with a form to generate dynamic access keys.

2. **Dynamic Key Endpoint**  
   This endpoint interacts with the [Outline Server API](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/Jigsaw-Code/outline-server/master/src/shadowbox/server/api.yml). It creates a static access key upon the first connection using the dynamic key.

### Live Demo
You can try the service live at: [https://my.freeoutlineserver.net](https://my.freeoutlineserver.net)

## Deployment

We manage the code with the [clasp command line tool](https://developers.google.com/apps-script/guides/clasp).

### Create Apps Script project

```
clasp create --type "webapp" --title "Outline Distribution"
```

### Configure project settings

Open the project on the browser:

```
clasp open
```

In the Project Settings, under Script Properties, create a `API_URL` property with the value of the server management API URL.

### Deploy

```
clasp deploy
```

### Open the web app
```
clasp open --webapp
```

## Development

Use [`clasp clone`](https://developers.google.com/apps-script/guides/clasp#clone_an_existing_project) with the project id to create the .clasp.json file:
```
clasp clone 17x29dO2HTBdvBMZxYI_k5K3lcY7jZtvY1E4ErUFJ2abzYGpXFs5Uzftn
```

To open the project on the browser:

```
clasp open
```
