# Outline Distribution

This project provides a system to distribute access keys of Outline VPN services. It uses [Google Apps Script](https://developers.google.com/apps-script) as a host with a high collateral shared domain (scripts.google.com) and to authenticate users.

## Deployment

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

We manage the code with the [clasp command line tool](https://developers.google.com/apps-script/guides/clasp)

Use [`clasp clone`](https://developers.google.com/apps-script/guides/clasp#clone_an_existing_project) with the project id to create the .clasp.json file:
```
clasp clone 17x29dO2HTBdvBMZxYI_k5K3lcY7jZtvY1E4ErUFJ2abzYGpXFs5Uzftn
```

To open the project on the browser:

```
clasp open
```

## TO DO

- Use shared storage
- Dynamic Key
- Session Key