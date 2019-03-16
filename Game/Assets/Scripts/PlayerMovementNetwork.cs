using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerMovementNetwork : MonoBehaviour {
    Rigidbody rigidBody;
    public float v;
    public float h;
    public bool isMoving;
    // Use this for initialization
    void Start () {
        rigidBody = GetComponent<Rigidbody>();
        isMoving = false;
	}
	
	// Update is called once per frame
	public void Update () {
        
        if ( Mathf.Abs(v) > 0)
        {
            rigidBody.AddForce(transform.up * 10f * v);
            isMoving = true;
            Debug.Log("Key Down");

        }
        else
        {
            if (isMoving) { 
                rigidBody.velocity = Vector2.zero;
                v = 0;
                isMoving = false;
                Debug.Log("Key Up");
            }
           
        }

        //Network.Move(v,h);

	}
}
