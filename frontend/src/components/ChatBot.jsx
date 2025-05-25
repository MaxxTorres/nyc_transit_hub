import { useState } from 'react'
import { FaPaperPlane } from 'react-icons/fa6'
import { FaSquareMinus } from 'react-icons/fa6'
import { FaCommentDots } from 'react-icons/fa6'
import StationCard from './StationCard'

export default function ChatBot({setFocusedStation}) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [output, setOutput] = useState([])
    const [show, setShow] = useState(false)
  
    const sendMessage = async () => {
      const newMessages = [...messages, input ];
      setMessages(newMessages);
  
      const res = await fetch('http://127.0.0.1:5000/api/processChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      console.log("Bot response:", data);

      setOutput(data)
      setInput('');
    };

    const handleShow = () => {
      setShow(!show)
    }

    const handleClick = (station) => {
      setFocusedStation(station)
    }
  
    return (
    <>
      {show ? 
      (
        <div className="shadow-lg text-sm bg-slate-100 w-80 p-5 rounded-lg border border-mainOrange">
          <button onClick={handleShow} className="absolute -top-2 -right-2">
            <div className="text-slate-400 flex items-center w-fit -p-4 text-xl bg-slate-100">
              <FaSquareMinus/>
            </div>
          </button>

          <div className="flex flex-col h-[300px] overflow-y-scroll">
            {messages.map((msg, i) => (
              <div key={i} className={""}>
                <span className="text-slate-400">You:</span> {msg}
              </div>
            ))}

            {output.length === 0?
            <div className="text-center text-slate-400">
              No results
            </div> :
            <>
            <div className="pl-1 pt-1 font-semibold text-slate-400">
              Stations found:
            </div>
            <div className="flex flex-row h-content gap-1 p-2 overflow-y-hidden overflow-x-auto bg-slate-200 rounded">
              {output.map((station, i) => (
                <div className="w-36 flex-shrink-0">
                  <button onClick={() => handleClick(station)}>
                    <StationCard label={station.stop_name} station={station} style={"small"}/>
                  </button>
                </div>
              ))}
            </div>
            </>
            }

          </div>


          <input
            className="bg-slate-200 p-1 m-1 mt-4 rounded-lg w-4/5"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />

          <button onClick={sendMessage} className="ml-1">
            <div className="text-mainOrange text-md"><FaPaperPlane/></div>
          </button>

          <div className="text-xs text-slate-400">
            To find a station, let me know your current street
          </div>
        </div>
      ) : 
      <button onClick={handleShow}>
        <div className="bg-white p-2 rounded-full mb-5 text-4xl text-mainOrange animate-bounce"><FaCommentDots/></div>
      </button>
      
      }
    </>
    )
  }
  