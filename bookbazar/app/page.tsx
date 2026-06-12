"use client";
import Footer from '@/components/home/footer';
import Hero from '@/components/home/hero';
import Feature from '@/components/home/featuresbook';
import Navbar from '@/components/Navbar';
import { CldImage } from 'next-cloudinary';
import ChatBot from './chat/page';
// By default, the CldImage component applies auto-format and auto-quality to all delivery URLs for optimized delivery.
export default function Page() {
  return (
    
   <>
   <Navbar/>
   <Hero/>
   <ChatBot/>

   <Feature/>
  <Footer/>
   </>
  );
}