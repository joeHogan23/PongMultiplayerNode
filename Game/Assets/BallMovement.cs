using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using SocketIO;
using System;

public class BallMovement : MonoBehaviour {

    static SocketIOComponent socket;

    static Vector3 moveDirection;

    static Vector2 position;

    [SerializeField] float speed = .02f;

    //[SerializeField] Spawner spawner;

	// Use this for initialization
	void Start () {
        ResetBall();
        //UnityEngine.Random.Range(1, -1), UnityEngine.Random.Range(1, -1));
	}
    // Update is called once per frame
    void FixedUpdate () {

        if (transform.position.x > 8)
        {
            Network.socket.Emit("resetRound");
            Network.socket.Emit("score", new JSONObject(Network.VectorToJson(0, -1)));
            Network.socket.Emit("resetRound");
        }

        if (transform.position.x < -8)
        {
            transform.position = Vector2.zero;
            Network.socket.Emit("score", new JSONObject(Network.VectorToJson(0, -1)));
            Network.socket.Emit("resetRound");
        }

        speed += .0001f;

        if (Network.StartGame)
        {
            GetComponent<Collider>().enabled = true;
            transform.Translate(moveDirection * speed, Space.World);
            Network.MoveHostBall(transform.position.x, transform.position.y);
            //socket.Emit("moveHostBall", Network.PosToJson(transform.position, 5));
        }
        else
        {
            GetComponent<Collider>().enabled = false;
            transform.position = Vector2.zero;
        }

    }
    public void OnCollisionEnter(Collision collision)
    {
        Vector2 location = transform.position;

        Vector2 normalized = (location - (Vector2)collision.contacts[0].point).normalized;

        moveDirection = Vector2.Reflect(moveDirection, normalized);
    }

    internal static void ResetBall()
    {
        moveDirection = new Vector2(
            UnityEngine.Random.Range(1, -1), UnityEngine.Random.Range(1, -1));
    }

}
