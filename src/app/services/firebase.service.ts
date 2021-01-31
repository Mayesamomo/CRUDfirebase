import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { ToastController } from '@ionic/angular';
import firebase from 'firebase/app';
import { Observable } from 'rxjs';
import { Task } from '../shared/task';
import { User } from '../shared/user';
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  //user$: User

  private snapshotChangesSubscription: any;

  constructor(private afs: AngularFirestore,
    private anFauth: AngularFireAuth,
    private toastr: ToastController,
    ) {

  }

  //get all tasks listed 
  getTasks(){
    return new Promise<any>((resolve) => {
      this.anFauth.user.subscribe(currentUser => {
        if(currentUser){
          this.snapshotChangesSubscription = this.afs.collection('people').doc(currentUser.uid).collection('tasks').snapshotChanges();
          resolve(this.snapshotChangesSubscription);
        }
      })
    })
  }

  getTask(taskId){
    return new Promise<any>((resolve, reject) => {
      this.anFauth.user.subscribe(currentUser => {
        if(currentUser){
          this.snapshotChangesSubscription = this.afs.doc<any>('people/' + currentUser.uid + '/tasks/' + taskId).valueChanges()
          .subscribe(snapshots => {
            resolve(snapshots);
          }, err => {
            reject(err)
          })
        }
      })
    });
  }

  unsubscribeOnLogOut(){
    //remember to unsubscribe from the snapshotChanges
    this.snapshotChangesSubscription.unsubscribe();
  }

  updateTask(taskKey, value){
    return new Promise<any>((resolve, reject) => {
      let currentUser = firebase.auth().currentUser;
      this.afs.collection('people').doc(currentUser.uid).collection('tasks').doc(taskKey).set(value)
      .then(
        res => resolve(res),
        err => reject(err)
      )
    })
  }

  deleteTask(taskKey){
    return new Promise<any>((resolve, reject) => {
      let currentUser = firebase.auth().currentUser;
      this.afs.collection('people').doc(currentUser.uid).collection('tasks').doc(taskKey).delete()
      .then(
        res => resolve(res),
        err => reject(err)
      )
    })
  }

  createTask(value){
    return new Promise<any>((resolve, reject) => {
      let currentUser = firebase.auth().currentUser;
      this.afs.collection('people').doc(currentUser.uid).collection('tasks').add({
        title: value.title,
        description: value.description,
        createdAt: new Date().getTime()

      })
      .then(
        res => resolve(res),
        err => reject(err)
      )
    })
  }

  // asychronous method so it doesn't wait for other methods before executing
  async toastCtrl(message: string, statusColor: string) {
    const toast = await this.toastr.create({
      message,
      position: 'top',
      color: statusColor,
      duration: 2000,
    });
    // toast alert is invoked
    toast.present();
  }

}
