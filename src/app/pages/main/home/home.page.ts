import { Component, OnInit, inject } from '@angular/core';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateProductComponent } from 'src/app/shared/components/add-update-product/add-update-product.component';
import { orderBy, where } from 'firebase/firestore';

// -------importar jspdf
declare let window: any;
import * as jsPDF from 'jspdf';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);

  products: Product[] = [];
  loading: boolean = false;

  ngOnInit() {}

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  ionViewWillEnter() {
    this.getProducts();
  }

  doRefresh(event) {
    setTimeout(() => {
      this.getProducts();
      event.target.complete();
    }, 1000);
  }

  // ============= Obtener ganancias =============
  getProfits(){
    return this.products.reduce((index, product) => index + product.price * product.soldUnits, 0);
  }

  // ============= Obtener productos =============
  getProducts() {
    let path = `users/${this.user().uid}/products`;

    this.loading = true;

    let query = [
      orderBy('soldUnits','desc')
    ]

    let sub = this.firebaseSvc.getCollectionData(path, query).subscribe({
      next: (res: any) => {
        console.log(res);
        this.products = res;

        this.loading = false;

        sub.unsubscribe();
      },
    });
  }
  // ========== Generar PDF =============
  generatePDF() {
    const doc = new jsPDF.default();
    doc.text('Detalle de Productos Vendidos y Ganancias Generadas', 10, 10);
    

    let totalProducts = 0;
    let totalProfits = 0;

    let y = 20;
    this.products.forEach((product, index) => {
      const productName = `Producto: ${product.name}`;
      const unitsSold = `Unidades vendidas: ${product.soldUnits}`;
      const profits = `Ganancias: $${(product.price * product.soldUnits).toFixed(2)}`;

      totalProducts += product.soldUnits;
      totalProfits += product.price * product.soldUnits;
      
      doc.text(productName, 10, y);
      doc.text(unitsSold, 10, y + 5);
      doc.text(profits, 10, y + 10);

      y += 20;
    });

    // Agregar total de productos y ganancias generadas
    doc.text(`Total de productos vendidos: ${totalProducts}`, 10, y + 20);
    doc.text(`Total de ganancias: $${totalProfits.toFixed(2)}`, 10, y + 25);

    // Abrir en otra ventana antes de guardarse
    const pdfData = doc.output();
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }


  // ========== Agregar o Actualizar producto ========
  async addUpdateProduct(product?: Product) {
    let success = await this.utilsSvc.presentModal({
      component: AddUpdateProductComponent,
      cssClass: 'add-update-modal',
      componentProps: { product },
    });

    if (success) this.getProducts();
  }

  // ========== Abrir PDF ========
  openPDF() {
    const doc = new jsPDF.default();
    doc.text('Hello world!', 10, 10);
    const pdfData = doc.output();
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

// ========== Confirmar eliminacion del producto ========
  async confirmDeleteProduct(product: Product) {
    this.utilsSvc.presentAlert({
      header: 'Eliminar Producto',
      message: '¿Quieres eliminar este producto',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
        }, {
          text: 'Si, eliminar',
          handler: () => {
            this.deleteProduct(product)
          }
        }
      ]
    });

  }


  // =====Eliminar producto =====
  async deleteProduct(product: Product) {
    let path = `users/${this.user().uid}/products/${product.id}`;
    const loading = await this.utilsSvc.loading();
    await loading.present();

    let imagePath = await this.firebaseSvc.getFilePath(product.image);
    await this.firebaseSvc.deleteFile(imagePath);

    this.firebaseSvc.deleteDocument(path).then(async (res) => {

      this.products = this.products.filter(p => p.id !== product.id);

        this.utilsSvc.presentToast({
          message: 'Producto eliminado exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline',
        });
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        loading.dismiss();
      });
  }
}
