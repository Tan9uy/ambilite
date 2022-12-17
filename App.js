/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState} from 'react';
import type {Node} from 'react';
import {Dimensions, Button, Image, TouchableOpacity} from 'react-native';
import {TextInput} from 'react-native-paper';

import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';

let corners = [0, 0, 0, 0];
let points = [];

let idx_consignes = 0;
let idx_etapes = 0;

// main stages of the configuration
const etapes = [
  'Etape 1 : calibration de la caméra',
  "Etape 2 : calibration des leds en fonction de l'écran",
  'Vous avez fini la calibration',
];

// main instructions to help the user know what he must do
const consignes = [
  "Merci de selectionner le coin à gauche en bas dans l'écran utilisé.",
  "Merci de selectionner le coin à gauche en haut dans l'écran utilisé.",
  "Merci de selectionner le coin à droite en haut dans l'écran utilisé.",
  "Merci de selectionner le coin à droite en bas dans l'écran utilisé.",
  "Merci de selectionner le milieu du bord gauche dans l'écran utilisé.",
  "Merci de selectionner le milieu du bord haut dans l'écran utilisé.",
  "Merci de selectionner le milieu du bord droit dans l'écran utilisé.",
  "Merci de selectionner le milieu du bord bas dans l'écran utilisé.",
  "Merci de régler les leds correspondant au bord gauche de l'écran avec les boutons raccourcir et allonger, vous pouvez voir le rendu derrière votre écran.",
  "Merci de régler les leds correspondant au bord haut de l'écran avec les boutons raccourcir et allonger, vous pouvez voir le rendu derrière votre écran.",
  "Merci de régler les leds correspondant au bord droit de l'écran avec les boutons raccourcir et allonger, vous pouvez voir le rendu derrière votre écran.",
  "Merci de régler les leds correspondant au bord bas de l'écran avec les boutons raccourcir et allonger, vous pouvez voir le rendu derrière votre écran.",
  'Appuyez sur sauvegarder et quiter, Si la configuration ne vous satisfait pas, vous pouvez toujours recommencer.',
];

/**
 * Get the current view of the camera with the keyPoints
 * @param {*} ip string ex : http://127.0.0.1:3000
 * @returns screen a base64 encoded image from the camera
 */
async function getScreen(ip) {
  let screen = '';
  // Send the keyPoints selected by the user
  try {
    let req = await fetch(ip + '/api/config', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'keyPoints',
        value: points,
      }),
    });
    if (req.status === 200) {
      let json = await req.json();
    } else {
      throw new Error('An error ocurred when setting the points');
    }
  } catch (err) {
    throw new Error('An error ocurred when setting the points');
  }

  // Get the image the current view of the camera with the keyPoints
  try {
    let req = await fetch(ip + '/api/screenshot', {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
    });
    if (req.status === 200) {
      let json = await req.json();
      screen = json.data;
    } else {
      throw new Error('An error ocurred when getting the screenshot');
    }
  } catch (err) {
    throw new Error('An error ocurred when getting the screenshot');
  }
  return screen;
}

/**
 * Enter the configuration mode and get previous values for the led count and update the view of the camera
 * @param {*} ip String ex : http://127.0.0.1:3000
 * @returns screen a base64 encoded image from the camera
 */
async function enterConfig(ip) {
  // get the corners already set in the config file
  try {
    let req = await fetch(ip + '/api/config/corners', {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
    });
    if (req.status === 200) {
      let json = await req.json();
      corners = json.corners;
      if (corners === undefined) {
        corners = [0, 0, 0, 0];
      }
    } else {
      throw new Error('An error ocurred when getting the corners');
    }
  } catch (err) {
    throw new Error('An error ocurred when getting the corners');
  }

  // Tell the API we are in calibration mode
  try {
    let req = await fetch(ip + '/api/config', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'calibration',
        value: true,
      }),
    });
    if (req.status !== 200) {
      throw new Error('An error ocurred when setting the calibration');
    }
  } catch (err) {
    throw new Error('An error ocurred when setting the calibration');
  }

  // Get the current view of the camera with the keyPoints
  return await getScreen(ip);
}

/**
 *  Update the leds count for each border
 * @param {*} ip String ex : http://127.0.0.1:3000
 * @param {*} number index of the current corner
 * @param {*} value a string wich can be ('+' or '-')
 */
async function updateLed(ip, number, value) {
  // update corners value
  if (value === '+') {
    corners[number]++;
  } else {
    if (corners[number] > 0) {
      corners[number]--;
    } else {
      return;
    }
  }
  // send it to the api
  try {
    let req = await fetch(ip + '/api/config', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'corners',
        value: corners,
      }),
    });
    if (req.status !== 200) {
      throw new Error('An error ocurred when the corners where updated');
    }
  } catch (err) {
    throw new Error('An error ocurred when the corners where updated');
  }
}

/**
 * Quit the calibration mode and notify the API
 * @param {*} ip String ex : http://127.0.0.1:3000
 */
async function exitConfig(ip) {
  try {
    let req = await fetch(ip + '/api/config', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'calibration',
        value: false,
      }),
    });
    if (req.status !== 200) {
      throw new Error('An error ocurred when exiting the config');
    }
  } catch (err) {
    throw new Error('An error ocurred when exiting the config');
  }
}

async function changeStatus(ip, statusApp) {
  let status = statusApp ? 'on' : 'off';
  try {
    let req = await fetch(ip + '/api/config/' + status, {
      method: 'PUT',
    });
    if (req.status !== 200) {
      throw new Error('An error ocurred when changing the status on/off');
    }
  } catch (err) {
    throw new Error('An error ocurred when changing the status on/off');
  }
}

/**
 * Main page of the App
 * @returns View
 */
const App: () => Node = () => {
  const [etape, setEtape] = useState<String>(etapes[0]);
  const [consigne, setConsigne] = useState<String>(consignes[0]);
  const [config, setConfig] = useState<Boolean>(false);
  const [ip, setIp] = useState<String>('http://10.0.0.53:3000');
  const [image, setImage] = useState<String>('');
  const isDarkMode = useColorScheme() === 'dark';
  const [next, setNext] = useState<Boolean>(true);
  const [statusApp, setStatusApp] = useState<Boolean>(false);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  // First page
  if (!config) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
            padding: 10,
            height: windowHeight,
            width: windowWidth,
          }}>
          <Button
            styles={{}}
            title={statusApp ? 'On' : 'Off'}
            onPress={() => {
              setStatusApp(!statusApp);
              changeStatus(ip, statusApp);
            }}
          />
          <Button
            styles={{}}
            title="Configurer"
            onPress={async () => {
              setConfig(true);
              if (statusApp) {
                setStatusApp(true);
                changeStatus(ip, statusApp);
              }
              setImage(await enterConfig(ip));
            }}
          />
          <TextInput
            styles={{}}
            label="Adresse IP backend"
            value={ip}
            onChangeText={newIp => setIp(newIp)}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Page to update the led count
  if (idx_consignes > 7 && idx_consignes < 12) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
            padding: 10,
            height: windowHeight,
            width: windowWidth,
          }}>
          <Text
            style={{
              marginVertical: 20,
              fontWeight: 'bold',
              fontSize: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {etape}
          </Text>
          <Text
            style={{
              marginVertical: 20,
            }}>
            {consigne}
          </Text>
          <View
            style={{backgroundColor: 'red', flex: 0.03, marginHorizontal: 20}}
          />
          <View
            style={{
              backgroundColor: isDarkMode ? Colors.black : Colors.white,
              flex: 0.5,
              flexDirection: 'row',
            }}>
            <View style={{backgroundColor: 'yellow', flex: 0.05}} />
            <View
              style={{
                backgroundColor: isDarkMode ? Colors.black : Colors.white,
                flex: 0.9,
              }}
            />
            <View style={{backgroundColor: 'blue', flex: 0.05}} />
          </View>

          <View
            style={{backgroundColor: 'green', flex: 0.03, marginHorizontal: 20}}
          />
          <View
            style={{
              backgroundColor: isDarkMode ? Colors.black : Colors.white,
              flex: 0.2,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Button
              styles={{}}
              title="Raccourcir"
              onPress={async () => {
                await updateLed(ip, idx_consignes - 8, '-');
              }}
            />
            <Button
              styles={{}}
              title="Allonger"
              onPress={async () => {
                await updateLed(ip, idx_consignes - 8, '+');
              }}
            />
          </View>
          <View
            style={{
              backgroundColor: isDarkMode ? Colors.black : Colors.white,
              flex: 0.3,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Button
              styles={{}}
              title="Revenir en arrière"
              onPress={() => {
                idx_consignes--;
                if (idx_consignes === 12) {
                  idx_etapes--;
                  setEtape(etapes[idx_etapes]);
                }
              }}
            />
            <Button
              title="continuer"
              onPress={() => {
                if (idx_consignes === 11) {
                  idx_etapes++;
                  setEtape(etapes[idx_etapes]);
                }
                idx_consignes++;
                setConsigne(consignes[idx_consignes]);
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // page to set the keyPoints on the camera view
  if (idx_consignes < 8) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
            padding: 10,
            height: windowHeight,
            width: windowWidth,
          }}>
          <Text
            style={{
              marginVertical: 20,
              fontWeight: 'bold',
              fontSize: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {etape}
          </Text>
          <Text
            style={{
              marginVertical: 20,
            }}>
            {consigne}
          </Text>
          <View
            style={{
              width: windowWidth - 20,
              height: (9 / 16) * (windowWidth - 20),
            }}>
            <TouchableOpacity
              onPress={async evt => {
                width = parseInt(windowWidth - 20);
                height = parseInt((9 / 16) * (windowWidth - 20));
                cameraX = parseInt((evt.nativeEvent.locationX / width) * 640);
                cameraY = parseInt((evt.nativeEvent.locationY / height) * 480);
                if (points.length > idx_consignes) {
                  points[idx_consignes] = {x: cameraX, y: cameraY};
                } else {
                  points.push({x: cameraX, y: cameraY});
                }

                setNext(false);
                setImage(await getScreen(ip));
              }}>
              <Image
                source={{uri: `data:image/jpg;base64,${image}`}}
                style={{
                  width: windowWidth - 20,
                  height: (9 / 16) * (windowWidth - 20),
                }}
              />
            </TouchableOpacity>
          </View>
          <View
            style={{
              backgroundColor: isDarkMode ? Colors.black : Colors.white,
              flex: 0.3,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Button
              styles={{}}
              title="Revenir en arrière"
              onPress={() => {
                if (idx_consignes === 8) {
                  idx_etapes--;
                  setEtape(etapes[idx_etapes]);
                }
                if (idx_consignes > 0) {
                  idx_consignes--;
                  setConsigne(consignes[idx_consignes]);
                }
                if (idx_consignes === 0) {
                  setConfig(false);
                }
              }}
            />
            <Button
              title="continuer"
              disabled={next}
              onPress={() => {
                if (idx_consignes === 7) {
                  idx_etapes++;
                  setEtape(etapes[idx_etapes]);
                }
                idx_consignes++;
                setConsigne(consignes[idx_consignes]);
                setNext(true);
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Last page when the configation is done
  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View
        style={{
          backgroundColor: isDarkMode ? Colors.black : Colors.white,
          padding: 10,
          height: windowHeight,
          width: windowWidth,
        }}>
        <Text
          style={{
            marginVertical: 20,
            fontWeight: 'bold',
            fontSize: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {etape}
        </Text>
        <Text
          style={{
            marginVertical: 20,
          }}>
          {consigne}
        </Text>
        <Button
          styles={{}}
          title="Sauvegarder et quitter"
          onPress={async () => {
            setConfig(false);
            await exitConfig(ip);
            idx_consignes = 0;
            idx_etapes = 0;
            setConsigne(consignes[idx_consignes]);
            setEtape(etapes[idx_etapes]);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default App;
