import { Injectable, NgZone } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { User } from '../shared/user';
import firebase from 'firebase/app';
import { FirebaseService } from './firebase.service';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // store user's collections to parse their data along with it
  private userCollection: AngularFirestoreCollection<User>;
  private users: Observable<User[]>
  constructor(
    public angularFireAuth: AngularFireAuth,
    // private firebaseService: FirebaseService,

    private ngFireStore: AngularFirestore,
    private toastr: ToastController,
    private router: Router,
    private ngZone: NgZone
  ) {
    // on load , user;s details are pulled 
    this.userCollection = ngFireStore.collection<User>('users');
    this.users = this.userCollection.snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return { id, ...data };
        })
      })
    )
  }
//register a new users
  RegisterUser(value) {
    return new Promise<any>((resolve, reject) => {
      this.angularFireAuth.createUserWithEmailAndPassword(value.email, value.password)
        .then(res => {
          let user: User = {
            id: res.user.uid,
            email: res.user.email,
            displayName: res.user.displayName,
            emailVerified: res.user.emailVerified

          };
          this.userCollection.doc(res.user.uid).set(user);
          resolve(res);
          this.toastCtrl('rgistered successfully, please check your inbox to verify your email', 'success');
          this.SendVerificationMail();
          return;
        }).catch((err) => {
          this.toastCtrl(err, 'danger');
          reject();
        })
    })
  }

  signIn(value) {
    return new Promise<any>((resolve, reject) => {
      this.angularFireAuth.signInWithEmailAndPassword(value.email, value.password)
        .then((data) => {
          console.log(data);
          if (!data.user.emailVerified) {
            this.toastCtrl('Please check your inbox and verify your email', 'danger');
            this.SignOut();
            this.router.navigate(['/signin']); // not fuly authenticated yet
            // removes user authentication
          }
          this.ngZone.run(() => {
            this.toastCtrl('logged in', 'success');
            this.router.navigate(['home']);
          });
          // resolve();
        }).catch((err) => {
          this.toastCtrl(err, 'danger');
          reject();
        })
    })
  }

  // checks if user email is verified
  async isEmailVerified(user: User): Promise<boolean> {
    return user.emailVerified === true ? true : false;
  }

  // Email verification when new user register
  async SendVerificationMail() {
    return (await this.angularFireAuth.currentUser).sendEmailVerification()
      .then(() => {
        this.router.navigate(['verify-email']);
      });
  }



  // Sign-out
  async SignOut() {
    await this.angularFireAuth.signOut();
    localStorage.removeItem('user');
    this.router.navigate(['/signin']);
  }
//get current user
  getCurrentUser() {
    if(this.angularFireAuth.currentUser) {
      return this.angularFireAuth.currentUser;
    } else {
      return null;
    }
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
