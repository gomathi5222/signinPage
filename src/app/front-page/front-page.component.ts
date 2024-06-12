import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import Map from '@arcgis/core/Map.js';
import Mapview from '@arcgis/core/views/MapView.js';
// import { Popup, Collection, ActionButton } from '@arcgis/core';
import Zoom from '@arcgis/core/widgets/Zoom.js';
import Directions from '@arcgis/core/widgets/Directions.js';
import RouteLayer from '@arcgis/core/layers/RouteLayer.js';
import Compass from '@arcgis/core/widgets/Compass.js';
import Expand from '@arcgis/core/widgets/Expand.js';
import Search from '@arcgis/core/widgets/Search.js';
import Basemap from '@arcgis/core/Basemap';
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery.js';
import Locate from '@arcgis/core/widgets/Locate.js';
import Home from '@arcgis/core/widgets/Home.js';
import Fullscreen from '@arcgis/core/widgets/Fullscreen.js';
import * as locator from '@arcgis/core/rest/locator.js';
import esriConfig from '@arcgis/core/config.js';
import Graphic from '@arcgis/core/Graphic.js';
import ScaleBar from '@arcgis/core/widgets/ScaleBar.js';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer.js';
import LabelClass from '@arcgis/core/layers/support/LabelClass.js';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils.js';
import Point from '@arcgis/core/geometry/Point.js';
// import { watch } from '@arcgis/core/watchUtils';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js';
import * as json from 'src/assets/services.json';
import MapView from '@arcgis/core/views/MapView.js';
// import ActionButton from 'esri/support/actions/ActionButton';
@Component({
  selector: 'app-front-page',
  templateUrl: './front-page.component.html',
  styleUrls: ['./front-page.component.css'],
})
export class FrontPageComponent implements OnInit, AfterViewInit, OnDestroy {
  map: Map = new Map();
  view!: MapView;
  res: any = [];
  services: any = json;
  layer: any;
  // btn = watch;
  routeLayer = new RouteLayer({ title: 'Route Layer' });
  @ViewChild('signIn', { static: true }) signIn!: ElementRef;
  @ViewChild('Atm', { static: true }) Atm!: ElementRef;
  @ViewChild('mapViewNode', { static: true }) el!: ElementRef;
  @ViewChild('MangaloreLogo', { static: true }) imgLogo!: ElementRef;
  async initialzeMap(): Promise<any> {
    const container = this.el.nativeElement;
    esriConfig.apiKey =
      'AAPK177f329c12de4ae498979677870e0f33o8JOIdohoYtL8QcdoJpH-DjxV06mmNplIZg9i1OGXb2yPc9bbWfZBq4Fvtqg4Y6N';
    let popupPin = {
      type: 'picture-marker', // autocasts as new PictureMarkerSymbol()
      url: 'assets/images/popupPinRed.png',
      width: '48px',
      height: '48px',
    };
    const geocodingService =
      'https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer';
    this.map = new Map({
      basemap: 'hybrid',
      layers: [this.routeLayer],
    });

    const view = new Mapview({
      map: this.map,
      container: container,
      center: [74.84347, 12.8675],
      zoom: 17,
      constraints: {
        snapToZoom: false,
      },
      ui: { padding: { left: 35, top: 15, right: 35, bottom: 35 } },
    });
    const element: HTMLElement = this.imgLogo.nativeElement;
    const elementId: string = element.id;
    console.log('Element ID:', elementId);
    view.ui.add(element, { position: 'top-left' });
    view.ui.remove(['attribution', 'zoom']);

    const searchWidget = new Search({
      view: view,
      container: document.createElement('div'),
      searchAllEnabled: true,

      maxSuggestions: 5,
      maxResults: 1,
    });
    const searchContainer = searchWidget.container as HTMLElement;
    const esriSearch = document.getElementsByClassName(
      'esri-component esri-search esri-widget'
    );
    const menuBtn = document.createElement('button');
    menuBtn.innerHTML = `<i class="fa-solid fa-diamond-turn-right" style="color: #000000;"></i>`;

    menuBtn.id = 'menuBtn';

    view.when(() => {
      menuBtn.id = 'menuBtn';
      menuBtn.classList.add('menuBtn');
    });
    searchContainer.append(menuBtn);
    let directionsWidget = new Directions({
      layer: this.routeLayer,
      apiKey:
        'AAPK177f329c12de4ae498979677870e0f33o8JOIdohoYtL8QcdoJpH-DjxV06mmNplIZg9i1OGXb2yPc9bbWfZBq4Fvtqg4Y6N',
      view,
      headingLevel: 3,
      visibleElements: {
        saveAsButton: false,
        saveButton: false,
      },
      container: document.createElement('div'),
      // container: document.getElementById("directionDiv"),
    });
    const directionContainer = directionsWidget.container as HTMLElement;
    directionContainer.setAttribute('id', 'direction--widget');
    const btnDiv = document.createElement('div');
    btnDiv.id = 'btn--div';
    const btnClose = document.createElement('button');
    btnClose.id = 'clear--dir-widget';
    btnClose.innerHTML = `<i class="fa-solid fa-xmark"></i></button>`;
    btnDiv.append(btnClose);
    directionContainer.append(btnDiv);
    btnClose.onclick = function () {
      view.ui.remove(directionsWidget);
      directionsWidget.viewModel.reset();
    };
    menuBtn.onclick = function () {
      view.ui.add(directionsWidget, 'top-left');
    };
    view.ui.add({ component: searchContainer, position: 'top-left', index: 1 });

    view.on('click', (event) => {
      if (event.button == 2) {
        searchWidget.clear();
        reverseGeocode(event.mapPoint);
      }
    });
    function reverseGeocode(pt: any) {
      const params = {
        location: pt,
      };
      locator.locationToAddress(geocodingService, params).then(
        (response) => {
          if (response) {
            searchWidget.searchTerm = response.attributes.LongLabel;
            showPopup(response);
          }
        },
        (err: any) => {
          showPopup(err);
        }
      );
    }
    function showPopup(response: { attributes?: any; location: any }) {
      if (!response) {
        return;
      }

      view.when(() => {
        const popup = view.popup as __esri.Popup;

        const popupTemplate = new PopupTemplate({
          actions: [
            {
              title: 'My Action',
              id: 'my-action',
              className: 'my-action-class',
              type: 'toggle',
              active: true,
              icon: 'esri-icon-map-pin',
              value: true,
              visible: true,
              disabled: false,
            },
          ],
        });

        popup.actions = popupTemplate.actions;
        // popup.on('trigger-action', (event: { action: { id: string } }) => {
        //   if (event.action.id === 'my-action') {
        //     console.log('hi');
        //   }
        // });
        const handle = reactiveUtils.watch(
          () => !view.updating,
          () => {
            // wkidSelect.disabled = false;
            console.log(view.popup);
          }
          // { once: true }
        );
        popupTemplate.actions.addHandles(handle);
        // popupTemplate.actions.forEach((action: any) => {
        //   if ('on' in action) {
        //     action.on('click', () => {
        //       // Handle action click event
        //     });
        //   } else {
        //     console.log(view.popup.actions);
        //   }
        // });
        // popupTemplate.actions.forEach((action) => {
        //   if (action.type === 'button') {
        //     const buttonAction = action as unknown as HTMLButtonElement;
        //     buttonAction.addEventListener('click', () => {
        //       console.log('hi');
        //     });
        //   }
        // });
        // view.popup.on('trigger-action', (event) => {
        //   if (event.action.id === 'y-action') {
        //     // Call your function here
        //     myFunction();
        //   }
        // });
        // function myFunction() {
        //   console.log('Button clicked!');
        //   // Add your logic here
        // }
        // popup.on('trigger-action', (event) => {
        //   if (event.action.id === 'my-action') {
        //     console.log('hi');
        //   } else if (event.action.id === 'my-action') {
        //     console.log('hi not working');
        //   }
        // });

        //   // view.on('trigger-action', (event) => {
        //   //   if (event.action.id === 'my-action') {
        //   //     alert('hi');
        //   //   } else if (event.action.id === 'edit-feature') {
        //   //     // Edit feature logic here
        //   //   }
        //   // });
      });

      view.openPopup({
        title: response.attributes.PlaceName || 'Address',
        content:
          response.attributes.LongLabel +
          '<br><br>' +
          response.location.longitude.toFixed(5) +
          ', ' +
          response.location.latitude.toFixed(5),
        location: response.location,
      });
      addGraphic1(response);
    }
    // this.view.popup.actions = [
    //   {
    //     title: 'Get Directions',
    //     id: 'directPopup',
    //     className: 'esri-icon-directions',
    //   },
    // ];
    function addGraphic1(res: { location: any }) {
      if (!res.location) {
        return;
      }
      view.graphics.removeAll();
      view.graphics.add(
        new Graphic({
          symbol: popupPin as __esri.SymbolProperties,
          geometry: res.location,
        })
      );
    }
    reactiveUtils.on(
      () => view.popup,
      'trigger-action',
      (event) => {
        if (event.action.id === 'directPopup') {
          getDirectionPopup();
        }
      }
    );
    // function getDirectionPopup() {
    //   const geom = view.popup.location;
    //   // console.log(view.popup);
    //   // await directionsWidget.when();
    //   let name = view.popup.content;

    //   // console.log(view.popup.selectedFeature.layer.id);
    //   // let ID = view.popup.selectedFeature.layer.id
    //   if (view.popup.title === "Search result") {
    //       //   alert(view.popup.features[0].attributes.Match_addr);
    //       name = view.popup.features[0].attributes.Match_addr;
    //   } else if (typeof (view.popup.content) === "string") {
    //       name = view.popup.content;
    //   } else {
    //       name = view.popup.title;
    //   }

    //   directionsWidget.layer.stops.at(1).name = name;
    //   directionsWidget.layer.stops.at(1).geometry = new Point({ x: geom.longitude, y: geom.latitude });
    //   // dirExpand.expanded = true;
    //   if (directionsWidget.visible == "true") {
    //       return;
    //   } else {
    //       view.ui.add(directionsWidget, "top-left")
    //   }
    //   console.log("direction from popup");
    // }
    const getDirectionPopup = () => {
      const geom = view.popup.location;
      const directionsWidget = new Directions({
        layer: this.routeLayer,
        apiKey: esriConfig.apiKey,
        view: view,
        headingLevel: 3,
        visibleElements: {
          saveAsButton: false,
          saveButton: false,
        },
        container: document.createElement('div'),
      });

      let name = view.popup.content as string;

      if (view.popup.title === 'Search result') {
        name = view.popup.features[0].attributes.Match_addr;
      } else if (typeof view.popup.content === 'string') {
        name = view.popup.content;
      } else {
        name = view.popup.title;
      }

      directionsWidget.layer.stops.at(1).name = name;
      directionsWidget.layer.stops.at(1).geometry = new Point({
        x: geom.longitude,
        y: geom.latitude,
      });

      if (!directionsWidget.visible) {
        view.ui.add(directionsWidget, 'top-left');
      }
    };
    let DirectPopup = {
      title: 'To Direction, Choose the from location',
      // The ID by which to reference the action in the event handler
      id: 'directPopup',
      // Sets the icon font used to style the action button
      className: 'esri-icon-directions',
    };
    // this.view.popup.actions = [DirectPopup];
    this.view = view;
    return await this.view.when();
  }
  createFeatureLayer(
    // this: any,
    symbolType: any,
    symbolIcon: any,
    url: any,
    titleName: any
  ) {
    let icon: any;
    icon = {
      type: 'simple',
      symbol: {
        type: symbolType,
        name: symbolIcon,
        styleName: 'Esri2DPointSymbolsStyle',
      },
    };
    this.map.remove(this.layer);
    this.layer = new FeatureLayer({
      url: url,
      screenSizePerspectiveEnabled: true,
      renderer: icon,
      labelingInfo: [
        new LabelClass({
          symbol: {
            type: 'text',
            color: 'white',
            haloColor: 'black',
            haloSize: '2px',
            font: {
              family: 'Arial',
              size: 10,
              weight: 'bold',
            },
          },
          labelExpressionInfo: {
            expression: '$feature.name',
          },
          labelPlacement: 'above-center',
          repeatLabel: true,
        }),
      ],
      title: titleName,
      outFields: ['*'],
      refreshInterval: 0.1,
      popupTemplate: new PopupTemplate({
        title: titleName,
        content: (feature: __esri.Feature) => {
          let content = '<div class="popup-content">';
          for (const attribute in feature.graphic.attributes) {
            if (feature.graphic.attributes.hasOwnProperty(attribute)) {
              content += `<b>${attribute}:</b> ${feature.graphic.attributes[attribute]}<br>`;
            }
          }
          content += '</div>';
          return content;
        },
      }),
    });

    this.layer
      .when(() => {
        return this.layer.queryExtent();
      })
      .then((response: { extent: any }) => {
        this.view.goTo(response.extent);
      });
    return this.map.add(this.layer);
  }
  //*************************************** */
  addLayers(event: any) {
    const buttonValue = (event.target as HTMLButtonElement).value;
    let obj = this.res.find((o: any) => o.titleName === buttonValue);
    console.log(obj.titleName);
    this.createFeatureLayer(
      obj.symbolType,
      obj.symbolIcon,
      obj.url,
      obj.titleName
    );
  }
  // *********************************************
  clearLayers() {
    this.map.removeAll();
    this.view.graphics.removeAll();
  }
  // *********************************************
  ngOnInit(): void {
    this.initialzeMap().then(() => {
      console.log('Map is working fine');
    });
    const data = this.services.services;
    for (let i = 0; i < data.length; i++) {
      this.res.push(data[i]);
    }
  }
  //**************************************************************
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }
  //**********************************************************
  ngAfterViewInit(): void {
    console.log(this.res);
    let zoomControl = new Zoom({
      view: this.view,
    });

    const searchWidget = new Search({
      view: this.view,
      container: document.createElement('div'),
      searchAllEnabled: true,

      maxSuggestions: 5,
      maxResults: 1,
    });
    const searchContainer = searchWidget.container as HTMLElement;
    const esriSearch = document.getElementsByClassName(
      'esri-component esri-search esri-widget'
    );
    const menuBtn = document.createElement('button');
    menuBtn.innerHTML = `<i class="fa-solid fa-diamond-turn-right" style="color: #000000;"></i>`;
    // menuBtn.innerHTML = 'C';
    menuBtn.id = 'menuBtn';
    const compass = new Compass({
      view: this.view,
    });
    const basemapGallery = new BasemapGallery({
      view: this.view,
      container: document.createElement('div'),
    });
    const bgExpand = new Expand({
      view: this.view,
      content: basemapGallery,
      expandTooltip: 'Basemap Gallery',
    });
    basemapGallery.watch('activeBasemap', () => {
      const mobileSize =
        this.view.heightBreakpoint === 'xsmall' ||
        this.view.widthBreakpoint === 'xsmall';
      if (mobileSize) {
        bgExpand.collapse();
      }
    });
    let locateWidget = new Locate({
      view: this.view, // Attaches the Locate button to the view
    });

    let homeWidget = new Home({
      view: this.view,
    });
    const fullscreen = new Fullscreen({
      view: this.view,
    });
    let scaleBar = new ScaleBar({
      view: this.view,
    });

    this.view.ui.add(
      [
        'signIn',
        zoomControl,
        compass,
        bgExpand,
        locateWidget,
        homeWidget,
        fullscreen,
      ],
      'top-right'
    );
    this.view.ui.add(
      [
        'Atm',
        'Banks',
        'Restaurants',
        'Bustops',
        'Government',
        'Medical',
        'park',
        'clear',
      ],
      'bottom-left'
    );
    this.view.ui.add(scaleBar, 'bottom-right');
  }
}
