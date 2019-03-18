using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using SocketIO;
using UnityEngine.UI;
using System;

public class NetworkInput : MonoBehaviour {
    public static SocketIOComponent socket;
    string userName;
    string password;

    [SerializeField] InputField nameInput;
    [SerializeField] InputField passwordInput;

    [SerializeField] GameObject inputForm;
    [SerializeField] GameObject userList;


    [SerializeField] Text listText;



    // Use this for initialization
    void Start () {
        socket = GetComponent<SocketIOComponent>();
        socket.On("connected", OnConnect);
        socket.On("hideform", OnHideForm);
        userList.SetActive(false);
	}

    private void OnHideForm(SocketIOEvent obj)
    {
        inputForm.SetActive(false);
        userList.SetActive(true);

        int i = 0;

        foreach (JSONObject name in obj.data["users"].list)
        {
            if (i > 9)
                break;
            listText.text +=  (i + 1).ToString() + " UserName: " + name["name"] +
                "      Wins: "+  name["wins"] + 
                "      Games Played: " + name["gamesplayed"] + "\n";
            i++;
        }
    }

    private void OnConnect(SocketIOEvent obj)
    {
        Debug.Log("We are connected to the server");
    }


    public void GrabFormData() {
        userName = nameInput.text;
        password = passwordInput.text;

        JSONObject data = new JSONObject(JSONObject.Type.OBJECT);
        data.AddField("name", userName);
        data.AddField("password", password);
        //data.AddField("password", password);

        //Add other fields here 
        socket.Emit("senddata", data);
    }
}
