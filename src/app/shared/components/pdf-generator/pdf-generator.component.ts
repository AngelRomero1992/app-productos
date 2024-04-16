import { Component, OnInit } from '@angular/core';

declare let window: any;

@Component({
  selector: 'app-pdf-generator',
  templateUrl: './pdf-generator.component.html',
  styleUrls: ['./pdf-generator.component.css']
})
export class PdfGeneratorComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  generatePDF() {
    const doc = new window.jspdf.jsPDF();
    doc.text('Hello world!', 10, 10);
    doc.save('test.pdf');
  }

  openPDF() {
    const doc = new window.jspdf.jsPDF();
    doc.text('Hello world!', 10, 10);
    const pdfData = doc.output();
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

}


