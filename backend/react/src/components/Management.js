import '../App.css';
import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
import ReactConsole from '@webscopeio/react-console';
import { config } from '../Constants'
var ENDPOINT = config.url.API_URL;

const Management = () => {
  const [response, setResponse] = useState("NOTYETLOADED")
  const [localTime, setLocalTime] = useState("NOTYETLOADED")
  const [activeCons, setActiveCons] = useState(-1)
  const [diffTime, setDiffTime] = useState(0)
  const [history, setHistory] = useState([
    "History: "
  ])
  const [health, setHealth] = useState("UNKNOWN");
  const matrix = Array.apply(null, Array(100))
  var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890+>?-$#@%&*';
  const [matrixMode, setMatrixMode] = useState(false);
  const [diffs, setDiffs] = useState([]);

const connect = () => {
  const socket = socketIOClient(ENDPOINT);
  socket.on("FromAPI", data => {

    const timeData = data.split(";")[0]
    const activeConData = data.split(";")[1]

    //active connections
    setActiveCons(activeConData)

    const currTime = new Date().getTime();
    const remoteMs = Date.parse(timeData);

    //calculate differents between remote and local
    const diff = currTime - remoteMs;
    if(diff < 0){
      return;
    }
    setDiffTime(diff);
    if(diffs > 100){
      (diffs.splice(1, 100))
    }
    if(diff>=0){
      setDiffs([...diffs, diff])
    }
    setResponse(remoteMs + "");
    setLocalTime(currTime + "");
  });
}

  useEffect(() => {
    connect();
  }, []);

  const calcMatrix = () => {
    let resultMatrix;
    matrix.forEach((part, index,array) => {
      var colLength = Math.floor(Math.random() * 20);
      var col = Array.apply(null, Array(colLength))
      col.forEach((colPart, colIndex, colArray) => {
        var randRep = Math.floor(Math.random() * (charSet.length));
        var char = charSet[randRep];
        colArray[colIndex] = char;
      })
    array[index] = col;
    resultMatrix = array;
    })
    return resultMatrix;
  }

  const calcAverage = (numbers) => {
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = (sum / numbers.length) || 0;
    return avg;
  }

  const healthCheck = ()  => {
    const currTime = new Date().getTime();
    var state = "UNKNOWN"
    var msg = ""
    if(Number.isNaN(+localTime)){
      state="CRITICAL"
      msg = " - NO PREV TIME FOUND"
      setHealth(state);
      return state + msg;
    }
    if(parseInt(localTime) - 3000 > currTime){
      state = "CRITICAL"
    }else{
      state ="HEALTHY"
    }
    setHealth(state);
    return state + msg;
  }


  const customCommands = {
    history: {
      description: 'History',
      fn: () => new Promise(resolve => {
        resolve(`${history.join('\r\n')}`)
      })
    },
    echo: {
      description: 'Echo',
      fn: (...args) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(`${args.join(' ')}`)
          }, 2000)
        })
      }
    },
    test: {
      description: 'Test',
      fn: (...args) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve('Hello world \n\n hello \n')
          }, 2000)
        })
      }
    },
  health: {
    description: 'Check health of backend server',
    fn: (...args) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          setHistory([...history, "health"])
          resolve(healthCheck())
        }, 1000)
      })
    }
  },
  rickroll: {
    description: '¯\\_(ツ)_/¯.',
    fn: (...args) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          setHistory([...history, "rickroll"])
          window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
          resolve("hihihihi");
        }, 1000)
      })
    }
  },
  help: {
    description: 'List hints & commands',
    fn: (...args) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          setHistory([...history, "help"])
         var res = Object.entries(customCommands).map((key,value) => key[0] + " - " + key[1].description + "\n")
         resolve(res.join(""));
        }, 1000)
      })
    }
  },
  matrix: {
    description: 'Enter the matrix',
    fn: (...args) => {
      return new Promise((resolve, reject) => {
        setMatrixMode(true)
        setTimeout(() => {
          setHistory([...history, "matrix"])
          setMatrixMode(false)
          resolve("Hello Neo")
        }, 15000)
      })
    }
  },
  forceconnect: {
    description: 'Force to create new connection',
    fn: (...args) => {
      return new Promise((resolve, reject) => {
          connect();
          resolve();
      })
    }
  },
  setport: {
    description: 'Set New Port',
    fn: (...args) => {
      return new Promise((resolve, reject) => {
         var port = args[0]
         ENDPOINT = "http://localhost:"+port;
         resolve("Updated port to " + port);
      })
    }
  },
  setendpoint: {
    description: 'Set New Endpoint (https://xxx:xx)',
    fn: (...args) => {
      return new Promise((resolve, reject) => {
         ENDPOINT = args[0] 
         resolve("Updated endpoint to " + ENDPOINT);
      })
    }
  },
  endpoint: {
    description: 'read Endpoint',
    fn: (...args) => {
      return new Promise((resolve, reject) => {
         resolve("Current " + ENDPOINT);
      })
    }
  }
  }

  return (
    <main className="area" >
      {matrixMode &&
      <div unselectable="on"  class="inbackground unselectable">
        <div className="mover">
          <div className="matrix-container">
          {calcMatrix().map((col, i) => {
            return (<div className="matrix-col">
              {col.map((char,i) => {
              return (<p className="m-letter">{char}</p>)
              })
            })
            </div>
            )
          })}
          </div>
        </div>
      </div>
       }
      <h1>PREN 11</h1>
      <div className="live-data" style={{ borderBottom: "3px solid green" }} >
        <h3>Analytics (HEALTH CHECK: <span className={`health-result ${health.toLowerCase()}`}>{health}</span>)</h3>
        <div style={{ display: 'flex', flexDirection: 'row', width: '100v'}}>
          <div style={{flexGrow:1}}>
            <p>
              Time on Remote &emsp; {response}
            </p>
            <p>
              Time  on Localhost &emsp; {localTime}
            </p>
            <h2>Difference: <span>{diffTime}ms</span> // Average: {calcAverage(diffs)}ms
            </h2>
          </div>
          <div style={{flexGrow:1, float:'right', textAlign:'end', marginRight:'2em'}}>
            <p>active connections: {activeCons}</p>
          </div>
        </div>
      </div>
      <div className="console" style={{ height: "50%%", flexGrow: "1", display: "flex", flexDirection: "column" , zIndex:100, background:"none"}}>
        <ReactConsole
          wrapperStyle={{ flexGrow: "1" }}
          autoFocus
          welcomeMessage={"######################\n Welcome to PREN11 CLI\n###################### \n Use help for all commands"}
          commands={customCommands}
        />

      </div>

    </main>
  );
}

export default Management;