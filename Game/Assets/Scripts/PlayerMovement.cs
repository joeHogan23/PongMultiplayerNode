using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class PlayerMovement : MonoBehaviour {
    Rigidbody rigidBody;
    bool isMoving;

    public Text score;

	// Use this for initialization
	void Start () {
        rigidBody = GetComponent<Rigidbody>();
        isMoving = false;
	}
	
	// Update is called once per frame
	void FixedUpdate () {
        if (Network.StartGame)
        {
            if (Mathf.Abs(Input.GetAxisRaw("Vertical")) > 0)
            {
                Debug.Log("Works");
                rigidBody.AddForce(transform.up * 10f * Input.GetAxisRaw("Vertical"));
                Network.Move(Input.GetAxisRaw("Vertical"), Input.GetAxisRaw("Horizontal"));

                isMoving = true;
            }
            else
            {
                if (isMoving)
                {
                    rigidBody.velocity = Vector2.zero;
                    Network.Move(0, 0);
                    isMoving = false;

                }
            }
        }
    }
}
