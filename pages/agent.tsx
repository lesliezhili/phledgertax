import Layout from '../components/Layout';
import Head from'next/head';import FinanceAgent from'../components/FinanceAgent';import{useState}from'react';
export default function A(){const[c,setC]=useState('ALL');return(<><Head><title>PHLedger Agent</title></Head><div style={{height:'100vh',display:'flex',flexDirection:'column'}}><main style={{flex:1,overflow:'hidden'}}><FinanceAgent country={c}/></main></div></>);}
