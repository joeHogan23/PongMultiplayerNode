using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using SocketIO;
using UnityEngine.UI;
using System;

public class NetworkInput : MonoBehaviour {
    public static SocketIOComponent socket;
    string userName;
    public InputField nameInput;
    public GameObject inputForm;
    public GameObject userList;
    public Text listText;



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
        Debug.Log(obj.data["users"].list);

        foreach (JSONObject name in obj.data["users"].list)
        {
            listText.text += name["name"].str + "\n";
        }
    }

    private void OnConnect(SocketIOEvent obj)
    {
        Debug.Log("We are connected to the server");
    }

   
    public void GrabFormData () {
        userName = nameInput.text;
        Debug.Log(userName);
        JSONObject data = new JSONObject(JSONObject.Type.OBJECT);
        data.AddField("name", userName);
        //Add other fields here 
        socket.Emit("senddata", data);
	}
}
