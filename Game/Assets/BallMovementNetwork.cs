using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using SocketIO;
using System;

public class BallMovementNetwork : MonoBehaviour {

    public SocketIOComponent socket;

    static Vector2 position = new Vector2(0, 0);

    // Use this for initialization
    void Start () {

	}

    static void MoveBall(float x, float y)
    {
        position = new Vector2(x, y);
    }

    // Update is called once per frame
    void FixedUpdate () {
        transform.position = position;
	}

    internal static void OnMoveNetworkBall(SocketIOEvent obj)
    {
        var x = float.Parse(obj.data["v"].str);
        var y = float.Parse(obj.data["h"].str);
        MoveBall(x, y);
    }
}
